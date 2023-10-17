// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./IWorthOfWords.sol";
import {MatchHistory, Scoring} from "./Scoring.sol";
import {Words} from "./Words.sol";
import {ScoreGuessVerifier} from "./generated/ScoreGuessVerifier.sol";
import {ValidWordVerifier} from "./generated/ValidWordVerifier.sol";

contract Lobbies is WorthOfWordsEvents {
    using Scoring for MatchHistory;
    using Words for Word;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Lobby {
        LobbyConfig config;
        mapping(address => Player) playersByAddress;
        EnumerableSet.AddressSet[] livePlayerAddressesByRound;
        uint48 phaseDeadline;
        uint32 roundNumber;
        uint32 numPlayersYetToAct;
        uint32 randomishSeed;
        Phase currentPhase;
    }

    struct Player {
        uint256[] secretWordCommitments;
        bytes32 guessCommitment;
        MatchHistory matchHistory;
        uint32 secretWordIndex;
        uint32 score;
        uint32 roundForGuess;
        Word guess;
    }

    uint32 private constant NUM_TARGETS = 3;
    // Sentinel value to save gas by not repeatedly setting to zero and back.
    bytes32 private constant NO_GUESS_COMMITMENT = bytes32(uint256(1));

    // *************************************************************************
    // * Modifiers
    // *************************************************************************

    modifier requirePhase(Lobby storage self, Phase phase) {
        if (self.currentPhase != phase) {
            revert WrongPhase(phase, self.currentPhase);
        }
        _;
    }

    modifier requirePhaseOrTransition(
        Lobby storage self,
        Phase previousPhase,
        Phase phase
    ) {
        if (
            self.currentPhase != phase &&
            (self.currentPhase != previousPhase ||
                block.timestamp <= uint256(self.phaseDeadline))
        ) {
            revert WrongPhase(phase, self.currentPhase);
        }
        _;
    }

    // *************************************************************************
    // * Internal mutable functions
    // *************************************************************************

    function _initializeLobby(
        Lobby storage self,
        LobbyId lobbyId,
        LobbyConfig calldata config
    ) internal {
        // Checks
        if (config.secretWordMerkleRoot == 0) {
            revert MissingSecretWordMerkleRoot();
        }
        if (config.guessWordMerkleRoot == bytes32(0)) {
            revert MissingGuessWordMerkleRoot();
        }
        if (config.maxPlayers < 2) {
            revert MaxPlayerCountTooLow();
        }
        if (config.maxPlayers < config.minPlayers) {
            revert PlayerCountRangeIsEmpty();
        }
        if (config.numLives == 0) {
            revert NumLivesIsZero();
        }

        // Effects
        self.config = config;
        self.randomishSeed = uint32(uint256(blockhash(block.number)));
        self.livePlayerAddressesByRound.push();

        emit LobbyCreated(lobbyId, msg.sender);
    }

    function _addPlayer(
        Lobby storage self,
        LobbyId lobbyId,
        string calldata playerName,
        bytes32 password,
        ValidWordProof[] calldata secretWordCommitments
    ) internal requirePhase(self, Phase.NotStarted) {
        // Checks
        if (self.livePlayerAddressesByRound[0].contains(msg.sender)) {
            revert AlreadyInLobby();
        }
        if (
            self.livePlayerAddressesByRound[0].length() >=
            uint256(self.config.maxPlayers)
        ) {
            revert LobbyIsFull(self.config.maxPlayers);
        }
        uint32 numCommitments = uint32(secretWordCommitments.length);
        if (numCommitments != self.config.numLives) {
            revert WrongNumberOfSecretWords(
                numCommitments,
                self.config.numLives
            );
        }
        _verifyPassword(self, password);
        for (uint32 i = 0; i < secretWordCommitments.length; i++) {
            _verifyValidWord(
                secretWordCommitments[i],
                i,
                self.config.secretWordMerkleRoot
            );
        }

        // Effects
        Player storage player = self.playersByAddress[msg.sender];
        for (uint32 i = 0; i < secretWordCommitments.length; i++) {
            player.secretWordCommitments.push() = secretWordCommitments[i]
                ._pubSignals[0];
        }
        self.livePlayerAddressesByRound[0].add(msg.sender);

        emit JoinedLobby(lobbyId, msg.sender, playerName);
    }

    function _startGame(
        Lobby storage self,
        LobbyId lobbyId
    ) internal requirePhase(self, Phase.NotStarted) {
        // Checks
        _validateCurrentPlayer(self);
        uint32 playerCount = _getLivePlayerCount(self);
        uint32 minPlayers = _getMinPlayerCount(self);
        if (playerCount < minPlayers) {
            revert NotEnoughPlayers(playerCount, minPlayers);
        }

        // Effects
        emit GameStarted(lobbyId, playerCount);
        _startRound(self, lobbyId);
    }

    function _commitGuess(
        Lobby storage self,
        LobbyId lobbyId,
        bytes32 commitment
    ) internal requirePhase(self, Phase.CommittingGuesses) {
        // Checks
        Player storage player = _validateCurrentPlayer(self);
        player.guessCommitment = commitment;
        emit GuessCommitted(lobbyId, msg.sender, player.score);

        if (--self.numPlayersYetToAct == 0) {
            _transitionToRevealGuessPhase(self, lobbyId);
        }
    }

    function _revealGuess(
        Lobby storage self,
        LobbyId lobbyId,
        Word guess,
        uint256 salt,
        bytes32[] calldata merkleProof
    )
        internal
        requirePhaseOrTransition(
            self,
            Phase.CommittingGuesses,
            Phase.RevealingGuesses
        )
    {
        if (self.currentPhase == Phase.CommittingGuesses) {
            // We can take this action because we're past the deadline of the
            // previous phase.
            _transitionToRevealGuessPhase(self, lobbyId);
        }

        // Checks
        Player storage player = _validateCurrentPlayer(self);
        if (uint256(player.guessCommitment) <= uint256(NO_GUESS_COMMITMENT)) {
            revert NoGuessCommitted();
        }
        if (
            keccak256(abi.encodePacked(guess, salt)) != player.guessCommitment
        ) {
            revert GuessDoesNotMatchCommitment(player.guessCommitment);
        }
        // See https://github.com/OpenZeppelin/merkle-tree#leaf-hash
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(guess))));
        if (
            !MerkleProof.verifyCalldata(
                merkleProof,
                self.config.guessWordMerkleRoot,
                leaf
            )
        ) {
            revert InvalidMerkleProofInGuessReveal();
        }

        // Effects
        player.guess = guess;
        player.roundForGuess = self.roundNumber;
        emit GuessRevealed(lobbyId, msg.sender, guess.toString());

        if (--self.numPlayersYetToAct == 0) {
            _transitionToRevealMatchesPhase(self, lobbyId);
        }
    }

    function _revealMatches(
        Lobby storage self,
        LobbyId lobbyId,
        ScoreGuessProof[] calldata proofs
    )
        internal
        requirePhaseOrTransition(
            self,
            Phase.RevealingGuesses,
            Phase.RevealingMatches
        )
    {
        if (self.currentPhase == Phase.CommittingGuesses) {
            // We can take this action because we're past the deadline of the
            // previous phase.
            _transitionToRevealMatchesPhase(self, lobbyId);
        }

        // Checks
        Player storage player = _validateCurrentPlayer(self);
        uint32[] memory offsets = _getTargetOffsets(self);
        if (proofs.length != offsets.length) {
            revert WrongNumberOfMatchReveals(
                uint32(proofs.length),
                uint32(offsets.length)
            );
        }

        // Handle each attacker in sequence.
        MatchHistory accumulatedHistory = player.matchHistory;
        string memory revealedSecretWord;
        for (uint32 i = 0; i < offsets.length; i++) {
            (
                MatchHistory newAccumulatedHistory,
                string memory newRevealedSecretWord
            ) = _handleAttack(
                    self,
                    lobbyId,
                    player,
                    offsets[i],
                    proofs[i],
                    i,
                    accumulatedHistory
                );
            accumulatedHistory = newAccumulatedHistory;
            if (bytes(newRevealedSecretWord).length > 0) {
                revealedSecretWord = newRevealedSecretWord;
            }
        }
        bool playerIsEliminated;
        if (bytes(revealedSecretWord).length > 0) {
            playerIsEliminated = _handleSecretWordFound(
                self,
                lobbyId,
                player,
                revealedSecretWord
            );
        }
        if (!playerIsEliminated) {
            _setUpPlayerForNextRound(self, player);
        }
        if (--self.numPlayersYetToAct == 0) {
            _transitionToNewRoundOrGameEnd(self, lobbyId);
        }
    }

    function _endRevealMatchesPhase(
        Lobby storage self,
        LobbyId lobbyId
    ) internal requirePhase(self, Phase.RevealingMatches) {
        if (block.timestamp <= uint256(self.phaseDeadline)) {
            revert DeadlineNotExpired(
                uint48(block.timestamp),
                self.phaseDeadline
            );
        }
        _transitionToNewRoundOrGameEnd(self, lobbyId);
    }

    // *************************************************************************
    // Private mutable functions
    // *************************************************************************

    function _startRound(Lobby storage self, LobbyId lobbyId) private {
        _setDeadline(self, self.config.maxCommitGuessTime);
        self.numPlayersYetToAct = _getLivePlayerCount(self);
        self.currentPhase = Phase.CommittingGuesses;
        emit NewRound(
            lobbyId,
            self.roundNumber,
            _getTargetOffsets(self),
            self.numPlayersYetToAct
        );
    }

    function _transitionToRevealGuessPhase(
        Lobby storage self,
        LobbyId lobbyId
    ) private {
        _setDeadline(self, self.config.maxRevealGuessTime);
        // Only players who committed a guess can act in this phase.
        self.numPlayersYetToAct =
            _getLivePlayerCount(self) -
            self.numPlayersYetToAct;
        self.currentPhase = Phase.RevealingGuesses;

        _emitNewPhaseEvent(self, lobbyId);
    }

    function _transitionToRevealMatchesPhase(
        Lobby storage self,
        LobbyId lobbyId
    ) private {
        _setDeadline(self, self.config.maxRevealMatchesTime);
        self.numPlayersYetToAct = _getLivePlayerCount(self);
        self.currentPhase = Phase.RevealingMatches;

        _emitNewPhaseEvent(self, lobbyId);
    }

    function _handleAttack(
        Lobby storage self,
        LobbyId lobbyId,
        Player storage player,
        uint32 offset,
        ScoreGuessProof calldata proof,
        uint32 proofIndex,
        MatchHistory accumulatedHistory
    )
        private
        returns (
            MatchHistory newAccumulatedHistory,
            string memory revealedSecretWord
        )
    {
        (
            address attackerAddress,
            Player storage attacker
        ) = _getAttackerForOffset(self, _getCurrentPlayerIndex(self), offset);
        if (attacker.roundForGuess != self.roundNumber) {
            // Attacker didn't reveal a guess this round.
            return (accumulatedHistory, "");
        }
        uint32[5] memory guessLetters = attacker.guess.toLetters();
        _verifyMatches(player, proof, proofIndex, attacker.guess, guessLetters);
        Color[5] memory matches = _getMatchesFromProof(proof);
        (uint32 newYellowCount, uint32 newGreenCount) = player
            .matchHistory
            .scoreMatches(guessLetters, matches);
        uint32 reward = newYellowCount *
            self.config.pointsForYellow +
            newGreenCount *
            self.config.pointsForGreen;
        string memory guessAsString = attacker.guess.toString();
        if (_isFullMatch(matches)) {
            reward += self.config.pointsForFullWord;
            revealedSecretWord = guessAsString;
        }
        newAccumulatedHistory = accumulatedHistory.accumulateMatches(
            guessLetters,
            matches
        );

        // Effects
        attacker.score += reward;
        emit MatchesRevealed(
            lobbyId,
            attackerAddress,
            msg.sender,
            guessAsString,
            matches,
            newYellowCount,
            newGreenCount,
            reward
        );
    }

    function _handleSecretWordFound(
        Lobby storage self,
        LobbyId lobbyId,
        Player storage player,
        string memory word
    ) private returns (bool playerIsEliminated) {
        player.matchHistory = MatchHistory.wrap(0);
        uint32 secretWordIndex = player.secretWordIndex++;
        emit SecretWordFound(lobbyId, msg.sender, word, secretWordIndex);
        playerIsEliminated = secretWordIndex == self.config.numLives - 1;
        if (playerIsEliminated) {
            emit PlayerEliminated(lobbyId, msg.sender);
        }
    }

    /**
     * Clear the player's guess commitment and add them to the next round's set
     * of live players.
     */
    function _setUpPlayerForNextRound(
        Lobby storage self,
        Player storage player
    ) private {
        uint32 nextRoundNumber = self.roundNumber + 1;
        if (self.livePlayerAddressesByRound.length < nextRoundNumber + 1) {
            self.livePlayerAddressesByRound.push();
        }
        self.livePlayerAddressesByRound[nextRoundNumber].add(msg.sender);
        player.guessCommitment = NO_GUESS_COMMITMENT;
        // Don't clear player.guess: the people we're attacking still need it
        // to reveal their matches.
    }

    function _transitionToNewRoundOrGameEnd(
        Lobby storage self,
        LobbyId lobbyId
    ) private {
        if (_shouldEndGame(self)) {
            self.currentPhase = Phase.GameOver;
            emit GameEnded(lobbyId);
        } else {
            self.roundNumber++;
            _startRound(self, lobbyId);
        }
    }

    function _setDeadline(Lobby storage self, uint32 timeLimit) private {
        self.phaseDeadline = uint48(block.timestamp) + uint48(timeLimit);
    }

    function _emitNewPhaseEvent(Lobby storage self, LobbyId lobbyId) private {
        emit NewPhase(
            lobbyId,
            self.currentPhase,
            self.roundNumber,
            self.phaseDeadline
        );
    }

    // *************************************************************************
    // * Private view functions
    // *************************************************************************

    function _validateCurrentPlayer(
        Lobby storage self
    ) private view returns (Player storage) {
        Player storage player = self.playersByAddress[msg.sender];
        if (player.secretWordCommitments.length == 0) {
            revert PlayerNotInLobby();
        }
        if (
            player.secretWordIndex == player.secretWordCommitments.length ||
            !self.livePlayerAddressesByRound[self.roundNumber].contains(
                msg.sender
            )
        ) {
            revert PlayerIsEliminated();
        }
        return player;
    }

    function _verifyPassword(
        Lobby storage self,
        bytes32 password
    ) private view {
        bytes20 publicKey = self.config.privateGamePublicKey;
        if (publicKey == bytes20(0)) {
            return;
        }
        (address signer, , ) = ECDSA.tryRecover(
            password,
            abi.encodePacked(msg.sender)
        );
        if (bytes20(signer) != publicKey) {
            revert IncorrectLobbyPassword();
        }
    }

    function _getTargetOffsets(
        Lobby storage self
    ) private view returns (uint32[] memory) {
        uint32 playerCount = _getLivePlayerCount(self);
        if (playerCount <= NUM_TARGETS + 1) {
            // All opponents are targets.
            uint32[] memory offsets = new uint32[](playerCount - 1);
            for (uint32 i = 0; i < playerCount - 1; i++) {
                offsets[i] = i + 1;
            }
            return offsets;
        } else {
            return
                _chooseRandomishOffsets(
                    playerCount,
                    self.randomishSeed,
                    self.roundNumber,
                    playerCount - 1 - NUM_TARGETS
                );
        }
    }

    function _getLivePlayerCount(
        Lobby storage self
    ) private view returns (uint32) {
        return uint32(_getLivePlayerAddresses(self).length());
    }

    function _getCurrentPlayerIndex(
        Lobby storage self
    ) private view returns (uint32) {
        // Annoyingly, EnumerableSet doesn't intentionally expose this "indexOf"
        // operation. Oh well, we'll reach in and take what we want.
        return
            uint32(
                _getLivePlayerAddresses(self)._inner._positions[
                    bytes32(uint256(uint160(msg.sender)))
                ] - 1
            );
    }

    function _getAttackerForOffset(
        Lobby storage self,
        uint256 playerIndex,
        uint32 offset
    ) private view returns (address, Player storage) {
        uint32 playerCount = _getLivePlayerCount(self);
        address attackerAddress = _getLivePlayerAddresses(self).at(
            uint256((playerIndex + playerCount - offset) % playerCount)
        );
        return (attackerAddress, self.playersByAddress[attackerAddress]);
    }

    function _getLivePlayerAddresses(
        Lobby storage self
    ) private view returns (EnumerableSet.AddressSet storage) {
        return self.livePlayerAddressesByRound[self.roundNumber];
    }

    function _verifyValidWord(
        ValidWordProof calldata proof,
        uint32 proofIndex,
        uint256 secretWordMerkleRoot
    ) private view {
        if (
            !ValidWordVerifier.verifyProof(
                proof._pA,
                proof._pB,
                proof._pC,
                proof._pubSignals
            )
        ) {
            revert InvalidSecretWordProof(proofIndex);
        }
        if (proof._pubSignals[1] != secretWordMerkleRoot) {
            revert InvalidMerkleProofInSecretWordProof(proofIndex);
        }
    }

    function _verifyMatches(
        Player storage player,
        ScoreGuessProof calldata proof,
        uint32 proofIndex,
        Word guess,
        uint32[5] memory guessLetters
    ) private view {
        if (
            !ScoreGuessVerifier.verifyProof(
                proof._pA,
                proof._pB,
                proof._pC,
                proof._pubSignals
            )
        ) {
            revert InvalidMatchProof(proofIndex, guess.toString());
        }
        if (
            proof._pubSignals[0] !=
            player.secretWordCommitments[player.secretWordIndex]
        ) {
            revert WrongSecretWordOrSaltInMatchProof(
                proofIndex,
                player.secretWordIndex,
                guess.toString()
            );
        }
        // Elements at spots [6, 11) of the public signals should correspond
        // to the letters of the guess.
        for (uint32 i = 0; i < 5; i++) {
            if (proof._pubSignals[6 + i] != uint256(guessLetters[i])) {
                revert WrongGuessInMatchProof(proofIndex, guess.toString());
            }
        }
    }

    /**
     * Returns true if either we are at the round limit or there are less than
     * two players left.
     */
    function _shouldEndGame(Lobby storage self) private view returns (bool) {
        uint32 roundNumber = self.roundNumber;
        uint32 maxRounds = uint32(self.config.maxRounds);
        return
            (maxRounds > 0 && roundNumber == maxRounds - 1) ||
            self.livePlayerAddressesByRound[roundNumber + 1].length() <= 1;
    }

    function _getMinPlayerCount(
        Lobby storage lobby
    ) private view returns (uint32) {
        uint32 count = lobby.config.minPlayers;
        return count < 2 ? 2 : count;
    }

    // *************************************************************************
    // * Private pure functions
    // *************************************************************************

    function _chooseRandomishOffsets(
        uint32 playerCount,
        uint32 randomishSeed,
        uint32 roundNumber,
        uint32 numOffsets
    ) private pure returns (uint32[] memory) {
        uint32[] memory offsets = new uint32[](numOffsets);
        uint32 salt = 0;
        for (uint32 i = 0; i < numOffsets; i++) {
            while (true) {
                bytes32 randomishHash = keccak256(
                    abi.encodePacked(randomishSeed, roundNumber, salt++)
                );
                uint32 offset = uint32(
                    (uint256(randomishHash) % (playerCount - 1)) + 1
                );
                if (!_arrayContainsBeforeIndex(offsets, offset, i)) {
                    offsets[i] = offset;
                    break;
                }
            }
        }
        return offsets;
    }

    function _arrayContainsBeforeIndex(
        uint32[] memory array,
        uint32 x,
        uint32 indexBound
    ) private pure returns (bool) {
        for (uint32 i = 0; i < indexBound; i++) {
            if (array[i] == x) {
                return true;
            }
        }
        return false;
    }

    function _getMatchesFromProof(
        ScoreGuessProof calldata proof
    ) private pure returns (Color[5] memory) {
        Color[5] memory matches;
        // Elements at spots [1, 6) of the public signals correspond to the
        // match colors.
        for (uint32 i = 0; i < 5; i++) {
            matches[i] = Color(proof._pubSignals[1 + i]);
        }
        return matches;
    }

    function _isFullMatch(Color[5] memory matches) private pure returns (bool) {
        for (uint32 i = 0; i < 5; i++) {
            if (matches[i] != Color.Green) {
                return false;
            }
        }
        return true;
    }
}
