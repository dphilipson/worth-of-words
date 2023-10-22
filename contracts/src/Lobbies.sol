// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./IWorthOfWords.sol";
import {MatchHistory, Scoring} from "./Scoring.sol";
import {Words} from "./Words.sol";
import {ScoreGuessVerifier} from "./generated/ScoreGuessVerifier.sol";
import {ValidWordVerifier} from "./generated/ValidWordVerifier.sol";

contract Lobbies is WorthOfWordsTypes, ScoreGuessVerifier, ValidWordVerifier {
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
        // Plus one so the initial value of 0 doesn't indicate a guess has
        // already been made.
        uint32 roundForGuessPlusOne;
        Word guess;
    }

    // Used in-memory to avoid a stack-too-deep error.
    struct AttackAccumulator {
        MatchHistory history;
        string revealedSecretWord;
        bool wasAttacked;
    }

    uint32 private constant NUM_TARGETS = 3;
    // Sentinel value to save gas by not repeatedly setting to zero and back.
    bytes32 private constant NO_GUESS_COMMITMENT = bytes32(uint256(1));

    // *************************************************************************
    // * Modifiers
    // *************************************************************************

    modifier requirePhase(Lobby storage lobby, Phase phase) {
        if (lobby.currentPhase != phase) {
            revert WrongPhase(phase, lobby.currentPhase);
        }
        _;
    }

    modifier kindlyRequirePhase(Lobby storage lobby, Phase phase) {
        if (lobby.currentPhase != phase) {
            return;
        }
        _;
    }

    modifier requireInOrReadyForPhase(
        Lobby storage lobby,
        Phase previousPhase,
        Phase phase
    ) {
        if (!_isInOrReadyForPhase(lobby, previousPhase, phase)) {
            revert WrongPhase(phase, lobby.currentPhase);
        }
        _;
    }

    modifier kindlyRequireInOrReadyForPhase(
        Lobby storage lobby,
        Phase previousPhase,
        Phase phase
    ) {
        if (!_isInOrReadyForPhase(lobby, previousPhase, phase)) {
            return;
        }
        _;
    }

    // *************************************************************************
    // * Internal mutable functions
    // *************************************************************************

    function _initializeLobby(
        Lobby storage lobby,
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
        lobby.config = config;
        lobby.randomishSeed = uint32(uint256(blockhash(block.number)));
        lobby.livePlayerAddressesByRound.push();

        emit LobbyCreated(lobbyId, msg.sender);
    }

    function _addPlayer(
        Lobby storage lobby,
        LobbyId lobbyId,
        string calldata playerName,
        bytes calldata password,
        ValidWordProof[] calldata secretWordCommitments
    ) internal requirePhase(lobby, Phase.NotStarted) {
        // Checks
        if (lobby.livePlayerAddressesByRound[0].contains(msg.sender)) {
            revert AlreadyInLobby();
        }
        if (
            lobby.livePlayerAddressesByRound[0].length() >=
            uint256(lobby.config.maxPlayers)
        ) {
            revert LobbyIsFull(lobby.config.maxPlayers);
        }
        uint32 numCommitments = uint32(secretWordCommitments.length);
        if (numCommitments != lobby.config.numLives) {
            revert WrongNumberOfSecretWords(
                numCommitments,
                lobby.config.numLives
            );
        }
        if (!_isValidPassword(lobby, password)) {
            revert IncorrectLobbyPassword();
        }
        for (uint32 i = 0; i < secretWordCommitments.length; i++) {
            _verifyValidWord(
                secretWordCommitments[i],
                i,
                lobby.config.secretWordMerkleRoot
            );
        }

        // Effects
        Player storage player = lobby.playersByAddress[msg.sender];
        for (uint32 i = 0; i < secretWordCommitments.length; i++) {
            player.secretWordCommitments.push() = secretWordCommitments[i]
                ._pubSignals[0];
        }
        lobby.livePlayerAddressesByRound[0].add(msg.sender);

        emit JoinedLobby(lobbyId, msg.sender, playerName);
    }

    function _startGame(
        Lobby storage lobby,
        LobbyId lobbyId
    ) internal kindlyRequirePhase(lobby, Phase.NotStarted) {
        // Checks
        _validateCurrentPlayer(lobby);
        uint32 playerCount = _getLivePlayerCount(lobby);
        uint32 minPlayers = _getMinPlayerCount(lobby);
        if (playerCount < minPlayers) {
            revert NotEnoughPlayers(playerCount, minPlayers);
        }

        // Effects
        emit GameStarted(lobbyId, playerCount);
        _startRound(lobby, lobbyId);
    }

    function _commitGuess(
        Lobby storage lobby,
        LobbyId lobbyId,
        bytes32 commitment
    ) internal requirePhase(lobby, Phase.CommittingGuesses) {
        // Checks
        Player storage player = _validateCurrentPlayer(lobby);
        player.guessCommitment = commitment;
        emit GuessCommitted(lobbyId, msg.sender, player.score);

        if (--lobby.numPlayersYetToAct == 0) {
            _transitionToRevealGuessPhase(lobby, lobbyId);
        }
    }

    function _revealGuess(
        Lobby storage lobby,
        LobbyId lobbyId,
        Word guess,
        uint256 salt,
        bytes32[] calldata merkleProof
    )
        internal
        requireInOrReadyForPhase(
            lobby,
            Phase.CommittingGuesses,
            Phase.RevealingGuesses
        )
    {
        if (lobby.currentPhase == Phase.CommittingGuesses) {
            // We can take this action because we're past the deadline of the
            // previous phase.
            _transitionToRevealGuessPhase(lobby, lobbyId);
        }

        // Checks
        Player storage player = _validateCurrentPlayer(lobby);
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
                lobby.config.guessWordMerkleRoot,
                leaf
            )
        ) {
            revert InvalidMerkleProofInGuessReveal();
        }

        // Effects
        player.guess = guess;
        player.roundForGuessPlusOne = lobby.roundNumber + 1;
        emit GuessRevealed(lobbyId, msg.sender, guess.toString());

        if (--lobby.numPlayersYetToAct == 0) {
            _transitionToRevealMatchesPhase(lobby, lobbyId);
        }
    }

    function _revealMatches(
        Lobby storage lobby,
        LobbyId lobbyId,
        ScoreGuessProof[] calldata proofs
    )
        internal
        requireInOrReadyForPhase(
            lobby,
            Phase.RevealingGuesses,
            Phase.RevealingMatches
        )
    {
        if (lobby.currentPhase == Phase.CommittingGuesses) {
            // We can take this action because we're past the deadline of the
            // previous phase.
            _transitionToRevealMatchesPhase(lobby, lobbyId);
        }

        // Checks
        Player storage player = _validateCurrentPlayer(lobby);
        uint32[] memory offsets = _getTargetOffsets(lobby);
        if (proofs.length != offsets.length) {
            revert WrongNumberOfMatchReveals(
                uint32(proofs.length),
                uint32(offsets.length)
            );
        }

        // Handle each attacker in sequence.
        AttackAccumulator memory accumulator = AttackAccumulator({
            history: player.matchHistory,
            revealedSecretWord: "",
            wasAttacked: false
        });
        for (uint32 i = 0; i < offsets.length; i++) {
            _handleAttack(
                lobby,
                lobbyId,
                player,
                offsets[i],
                proofs[i],
                i,
                accumulator
            );
        }
        player.matchHistory = accumulator.history;
        if (!accumulator.wasAttacked) {
            emit PlayerAdvancedWithNoAttackers(lobbyId, msg.sender);
        }
        bool playerIsEliminated;
        if (bytes(accumulator.revealedSecretWord).length > 0) {
            playerIsEliminated = _handleSecretWordFound(
                lobby,
                lobbyId,
                player,
                accumulator.revealedSecretWord
            );
        }
        if (!playerIsEliminated) {
            _setUpPlayerForNextRound(lobby, player);
        }
        if (--lobby.numPlayersYetToAct == 0) {
            _transitionToNewRoundOrGameEnd(lobby, lobbyId);
        }
    }

    function _endRevealMatchesPhase(
        Lobby storage lobby,
        LobbyId lobbyId
    ) internal kindlyRequirePhase(lobby, Phase.RevealingMatches) {
        if (block.timestamp <= uint256(lobby.phaseDeadline)) {
            revert DeadlineNotExpired(
                uint48(block.timestamp),
                lobby.phaseDeadline
            );
        }
        _transitionToNewRoundOrGameEnd(lobby, lobbyId);
    }

    // *************************************************************************
    // * Internal view functions
    // *************************************************************************

    function _isValidPassword(
        Lobby storage lobby,
        bytes calldata password
    ) internal view returns (bool) {
        bytes20 publicKey = lobby.config.privateGamePublicKey;
        if (publicKey == bytes20(0)) {
            return true;
        }
        (address signer, , ) = ECDSA.tryRecover(
            MessageHashUtils.toEthSignedMessageHash(
                abi.encodePacked(msg.sender)
            ),
            password
        );
        return bytes20(signer) == publicKey;
    }

    // *************************************************************************
    // * Private mutable functions
    // *************************************************************************

    function _startRound(Lobby storage lobby, LobbyId lobbyId) private {
        _setDeadline(lobby, lobby.config.maxCommitGuessTime);
        lobby.numPlayersYetToAct = _getLivePlayerCount(lobby);
        lobby.currentPhase = Phase.CommittingGuesses;
        emit NewRound(
            lobbyId,
            lobby.roundNumber,
            _getTargetOffsets(lobby),
            lobby.numPlayersYetToAct
        );
        _emitNewPhaseEvent(lobby, lobbyId);
    }

    function _transitionToRevealGuessPhase(
        Lobby storage lobby,
        LobbyId lobbyId
    ) private {
        _setDeadline(lobby, lobby.config.maxRevealGuessTime);
        // Only players who committed a guess can act in this phase.
        lobby.numPlayersYetToAct =
            _getLivePlayerCount(lobby) -
            lobby.numPlayersYetToAct;
        lobby.currentPhase = Phase.RevealingGuesses;

        _emitNewPhaseEvent(lobby, lobbyId);
    }

    function _transitionToRevealMatchesPhase(
        Lobby storage lobby,
        LobbyId lobbyId
    ) private {
        _setDeadline(lobby, lobby.config.maxRevealMatchesTime);
        lobby.numPlayersYetToAct = _getLivePlayerCount(lobby);
        lobby.currentPhase = Phase.RevealingMatches;

        _emitNewPhaseEvent(lobby, lobbyId);
    }

    function _handleAttack(
        Lobby storage lobby,
        LobbyId lobbyId,
        Player storage player,
        uint32 offset,
        ScoreGuessProof calldata proof,
        uint32 proofIndex,
        AttackAccumulator memory accumulator
    ) private {
        (
            address attackerAddress,
            Player storage attacker
        ) = _getAttackerForOffset(lobby, _getCurrentPlayerIndex(lobby), offset);
        if (attacker.roundForGuessPlusOne != lobby.roundNumber + 1) {
            // Attacker didn't reveal a guess this round.
            return;
        }
        accumulator.wasAttacked = true;
        uint32[5] memory guessLetters = attacker.guess.toLetters();
        _verifyMatches(player, proof, proofIndex, attacker.guess, guessLetters);
        Color[5] memory matches = _getMatchesFromProof(proof);
        (uint32 newYellowCount, uint32 newGreenCount) = player
            .matchHistory
            .scoreMatches(guessLetters, matches);
        uint32 reward = newYellowCount *
            lobby.config.pointsForYellow +
            newGreenCount *
            lobby.config.pointsForGreen;
        string memory guessAsString = attacker.guess.toString();
        if (_isFullMatch(matches)) {
            reward += lobby.config.pointsForFullWord;
            accumulator.revealedSecretWord = guessAsString;
        }
        accumulator.history = accumulator.history.accumulateMatches(
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
        Lobby storage lobby,
        LobbyId lobbyId,
        Player storage player,
        string memory word
    ) private returns (bool playerIsEliminated) {
        player.matchHistory = MatchHistory.wrap(0);
        uint32 secretWordIndex = player.secretWordIndex++;
        emit SecretWordFound(lobbyId, msg.sender, word, secretWordIndex);
        playerIsEliminated = secretWordIndex == lobby.config.numLives - 1;
        if (playerIsEliminated) {
            emit PlayerEliminated(lobbyId, msg.sender);
        }
    }

    /**
     * Clear the player's guess commitment and add them to the next round's set
     * of live players.
     */
    function _setUpPlayerForNextRound(
        Lobby storage lobby,
        Player storage player
    ) private {
        uint32 nextRoundNumber = lobby.roundNumber + 1;
        if (lobby.livePlayerAddressesByRound.length < nextRoundNumber + 1) {
            lobby.livePlayerAddressesByRound.push();
        }
        lobby.livePlayerAddressesByRound[nextRoundNumber].add(msg.sender);
        player.guessCommitment = NO_GUESS_COMMITMENT;
        // Don't clear player.guess: the people we're attacking still need it
        // to reveal their matches.
    }

    function _transitionToNewRoundOrGameEnd(
        Lobby storage lobby,
        LobbyId lobbyId
    ) private {
        if (_shouldEndGame(lobby)) {
            lobby.currentPhase = Phase.GameOver;
            emit GameEnded(lobbyId);
        } else {
            lobby.roundNumber++;
            _startRound(lobby, lobbyId);
        }
    }

    function _setDeadline(Lobby storage lobby, uint32 timeLimit) private {
        lobby.phaseDeadline = uint48(block.timestamp) + uint48(timeLimit);
    }

    function _emitNewPhaseEvent(Lobby storage lobby, LobbyId lobbyId) private {
        emit NewPhase(
            lobbyId,
            lobby.currentPhase,
            lobby.roundNumber,
            lobby.phaseDeadline
        );
    }

    // *************************************************************************
    // * Private view functions
    // *************************************************************************

    function _isInOrReadyForPhase(
        Lobby storage lobby,
        Phase previousPhase,
        Phase phase
    ) private view returns (bool) {
        return
            lobby.currentPhase == phase ||
            (lobby.currentPhase == previousPhase &&
                block.timestamp > uint256(lobby.phaseDeadline));
    }

    function _validateCurrentPlayer(
        Lobby storage lobby
    ) private view returns (Player storage) {
        Player storage player = lobby.playersByAddress[msg.sender];
        if (player.secretWordCommitments.length == 0) {
            revert PlayerNotInLobby();
        }
        if (
            player.secretWordIndex == player.secretWordCommitments.length ||
            !lobby.livePlayerAddressesByRound[lobby.roundNumber].contains(
                msg.sender
            )
        ) {
            revert PlayerIsEliminated();
        }
        return player;
    }

    function _getTargetOffsets(
        Lobby storage lobby
    ) private view returns (uint32[] memory) {
        uint32 playerCount = _getLivePlayerCount(lobby);
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
                    lobby.randomishSeed,
                    lobby.roundNumber,
                    playerCount - 1 - NUM_TARGETS
                );
        }
    }

    function _getLivePlayerCount(
        Lobby storage lobby
    ) private view returns (uint32) {
        return uint32(_getLivePlayerAddresses(lobby).length());
    }

    function _getCurrentPlayerIndex(
        Lobby storage lobby
    ) private view returns (uint32) {
        // Annoyingly, EnumerableSet doesn't intentionally expose this "indexOf"
        // operation. Oh well, we'll reach in and take what we want.
        return
            uint32(
                _getLivePlayerAddresses(lobby)._inner._positions[
                    bytes32(uint256(uint160(msg.sender)))
                ] - 1
            );
    }

    function _getAttackerForOffset(
        Lobby storage lobby,
        uint256 playerIndex,
        uint32 offset
    ) private view returns (address, Player storage) {
        uint32 playerCount = _getLivePlayerCount(lobby);
        address attackerAddress = _getLivePlayerAddresses(lobby).at(
            uint256((playerIndex + playerCount - offset) % playerCount)
        );
        return (attackerAddress, lobby.playersByAddress[attackerAddress]);
    }

    function _getLivePlayerAddresses(
        Lobby storage lobby
    ) private view returns (EnumerableSet.AddressSet storage) {
        return lobby.livePlayerAddressesByRound[lobby.roundNumber];
    }

    function _verifyValidWord(
        ValidWordProof calldata proof,
        uint32 proofIndex,
        uint256 secretWordMerkleRoot
    ) private view {
        if (
            !this.verifyValidWordProof(
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
            !this.verifyScoreGuessProof(
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
    function _shouldEndGame(Lobby storage lobby) private view returns (bool) {
        uint32 roundNumber = lobby.roundNumber;
        uint32 maxRounds = uint32(lobby.config.maxRounds);
        return
            (maxRounds > 0 && roundNumber == maxRounds - 1) ||
            lobby.livePlayerAddressesByRound[roundNumber + 1].length() <= 1;
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
