// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ShortString, ShortStrings} from "@openzeppelin/contracts/utils/ShortStrings.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IWorthOfWords} from "./IWorthOfWords.sol";
import {ValidWordVerifier} from "./generated/ValidWordVerifier.sol";

library Lobbies {
    using Lobbies for Lobby;
    using EnumerableSet for EnumerableSet.AddressSet;
    using ShortStrings for *;

    struct Lobby {
        IWorthOfWords.LobbyConfig config;
        mapping(address => Player) playersByAddress;
        EnumerableSet.AddressSet[] livePlayerAddressesByRound;
        uint48 phaseDeadline;
        uint32 roundNumber;
        uint32 numPlayersYetToAct;
        uint32 randomishSeed;
        IWorthOfWords.Phase currentPhase;
    }

    struct Player {
        ShortString name;
        uint256[] secretWordCommitments;
        bytes32 guessCommitment;
        IWorthOfWords.Word[] guessesToRespondTo;
        uint32 currentLife;
        uint32 score;
    }

    struct PlayerRound {
        bytes32 guessCommitment;
        IWorthOfWords.Word[] guessesToRespondTo;
    }

    uint32 constant NUM_TARGETS = 3;

    modifier requirePhase(Lobby storage self, IWorthOfWords.Phase phase) {
        if (self.currentPhase != phase) {
            revert IWorthOfWords.WrongPhase(phase, self.currentPhase);
        }
        _;
    }

    modifier requirePhaseOrTransition(
        Lobby storage self,
        IWorthOfWords.Phase previousPhase,
        IWorthOfWords.Phase phase
    ) {
        if (
            self.currentPhase != phase &&
            (self.currentPhase != previousPhase ||
                block.timestamp <= uint256(self.phaseDeadline))
        ) {
            revert IWorthOfWords.WrongPhase(phase, self.currentPhase);
        }
        _;
    }

    function initializeLobby(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        IWorthOfWords.LobbyConfig calldata config
    ) internal {
        // Checks
        if (config.secretWordMerkleRoot == 0) {
            revert IWorthOfWords.MissingSecretWordMerkleRoot();
        }
        if (config.guessWordMerkleRoot == bytes32(0)) {
            revert IWorthOfWords.MissingGuessWordMerkleRoot();
        }
        if (config.minPlayers < 2) {
            revert IWorthOfWords.MinPlayerCountTooLow();
        }
        if (config.maxPlayers < config.minPlayers) {
            revert IWorthOfWords.PlayerCountRangeIsEmpty();
        }
        if (config.numLives == 0) {
            revert IWorthOfWords.NumLivesIsZero();
        }

        // Effects
        self.config = config;
        self.randomishSeed = uint32(uint256(blockhash(block.number)));

        emit IWorthOfWords.LobbyCreated(lobbyId, msg.sender);
    }

    function addPlayer(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        string calldata playerName,
        bytes32 password,
        IWorthOfWords.ValidWordProof[] calldata secretWordCommitments
    ) internal requirePhase(self, IWorthOfWords.Phase.NotStarted) {
        // Checks
        if (self.livePlayerAddressesByRound[0].contains(msg.sender)) {
            revert IWorthOfWords.AlreadyInLobby();
        }
        if (
            self.livePlayerAddressesByRound[0].length() >=
            uint256(self.config.maxPlayers)
        ) {
            revert IWorthOfWords.LobbyIsFull(self.config.maxPlayers);
        }
        uint32 numCommitments = uint32(secretWordCommitments.length);
        if (numCommitments != self.config.numLives) {
            revert IWorthOfWords.WrongNumberOfSecretWords(
                numCommitments,
                self.config.numLives
            );
        }
        self._verifyPassword(password);
        for (uint32 i = 0; i < secretWordCommitments.length; i++) {
            _verifyValidWord(
                secretWordCommitments[i],
                i,
                self.config.secretWordMerkleRoot
            );
        }
        ShortString name = playerName.toShortString();

        // Effects
        Player storage player = self.playersByAddress[msg.sender];
        player.name = name;
        for (uint32 i = 0; i < secretWordCommitments.length; i++) {
            player.secretWordCommitments.push() = secretWordCommitments[i]
                ._pubSignals[0];
        }
        self.livePlayerAddressesByRound[0].add(msg.sender);

        emit IWorthOfWords.JoinedLobby(lobbyId, msg.sender, playerName);
    }

    function startGame(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId
    ) internal requirePhase(self, IWorthOfWords.Phase.NotStarted) {
        // Checks
        _validateCurrentPlayer(self);
        uint32 playerCount = self._getLivePlayerCount();
        if (self._getLivePlayerCount() < self.config.minPlayers) {
            revert IWorthOfWords.NotEnoughPlayers(
                playerCount,
                self.config.minPlayers
            );
        }

        // Effects
        self._setDeadline(self.config.maxCommitGuessTime);
        self.numPlayersYetToAct = playerCount;
        self.currentPhase = IWorthOfWords.Phase.CommittingGuesses;

        emit IWorthOfWords.GameStarted(lobbyId, playerCount);
    }

    function commitGuess(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        bytes32 commitment
    ) internal requirePhase(self, IWorthOfWords.Phase.CommittingGuesses) {
        // Checks
        Player storage player = _validateCurrentPlayer(self);
        player.guessCommitment = commitment;
        self.numPlayersYetToAct--;
        emit IWorthOfWords.GuessCommitted(lobbyId, msg.sender, player.score);

        if (self.numPlayersYetToAct == 0) {
            self._transitionToRevealGuessPhase(lobbyId);
        }
    }

    function revealGuess(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        IWorthOfWords.Word guess,
        uint256 salt
    )
        internal
        requirePhaseOrTransition(
            self,
            IWorthOfWords.Phase.CommittingGuesses,
            IWorthOfWords.Phase.RevealingGuesses
        )
    {
        if (self.currentPhase == IWorthOfWords.Phase.CommittingGuesses) {
            self._transitionToRevealGuessPhase(lobbyId);
        }
        // TODO
    }

    function revealMatches(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        IWorthOfWords.ScoreGuessProof[] calldata proofs
    )
        internal
        requirePhaseOrTransition(
            self,
            IWorthOfWords.Phase.RevealingGuesses,
            IWorthOfWords.Phase.RevealingMatches
        )
    {}

    function eliminateUnrevealedPlayers(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId
    ) internal requirePhase(self, IWorthOfWords.Phase.RevealingMatches) {}

    function getConfig(
        Lobby storage self
    ) internal view returns (IWorthOfWords.LobbyConfig memory) {
        revert("not implemented");
    }

    function getState(
        Lobby storage self
    ) internal view returns (IWorthOfWords.LobbyState memory) {
        revert("not implemented");
    }

    function _transitionToRevealGuessPhase(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId
    ) internal {
        self._setDeadline(self.config.maxRevealGuessTime);
        // Only players who committed a guess can act in this phase.
        self.numPlayersYetToAct =
            self._getLivePlayerCount() -
            self.numPlayersYetToAct;
        self.currentPhase = IWorthOfWords.Phase.RevealingGuesses;

        self._emitNewPhaseEvent(lobbyId);
    }

    function _setDeadline(Lobby storage self, uint32 timeLimit) internal {
        self.phaseDeadline = uint48(block.timestamp) + uint48(timeLimit);
    }

    function _emitNewPhaseEvent(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId
    ) internal {
        emit IWorthOfWords.NewPhase(
            lobbyId,
            self.currentPhase,
            self.roundNumber,
            self.phaseDeadline
        );
    }

    function _validateCurrentPlayer(
        Lobby storage self
    ) internal view returns (Player storage) {
        Player storage player = self.playersByAddress[msg.sender];
        if (player.secretWordCommitments.length == 0) {
            revert IWorthOfWords.PlayerNotInLobby();
        }
        if (
            player.currentLife == player.secretWordCommitments.length ||
            !self.livePlayerAddressesByRound[self.roundNumber].contains(
                msg.sender
            )
        ) {
            revert IWorthOfWords.PlayerIsEliminated();
        }
        return player;
    }

    function _verifyPassword(
        Lobby storage self,
        bytes32 password
    ) internal view {
        bytes20 publicKey = self.config.privateGamePublicKey;
        if (publicKey == bytes20(0)) {
            return;
        }
        (address signer, , ) = ECDSA.tryRecover(
            password,
            abi.encodePacked(msg.sender)
        );
        if (bytes20(signer) != publicKey) {
            revert IWorthOfWords.IncorrectLobbyPassword();
        }
    }

    function _verifyValidWord(
        IWorthOfWords.ValidWordProof calldata proof,
        uint32 proofIndex,
        uint256 secretWordMerkleRoot
    ) internal view {
        if (
            proof._pubSignals[1] != secretWordMerkleRoot ||
            !ValidWordVerifier.verifyProof(
                proof._pA,
                proof._pB,
                proof._pC,
                proof._pubSignals
            )
        ) {
            revert IWorthOfWords.InvalidSecretWordProof(proofIndex);
        }
    }

    function _getTargetOffsets(
        Lobby storage self
    ) internal view returns (uint32[] memory) {
        uint32 playerCount = self._getLivePlayerCount();
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
    ) internal view returns (uint32) {
        return
            uint32(self.livePlayerAddressesByRound[self.roundNumber].length());
    }

    function _chooseRandomishOffsets(
        uint32 playerCount,
        uint32 randomishSeed,
        uint32 roundNumber,
        uint32 numOffsets
    ) internal pure returns (uint32[] memory) {
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
    ) internal pure returns (bool) {
        for (uint32 i = 0; i < indexBound; i++) {
            if (array[i] == x) {
                return true;
            }
        }
        return false;
    }
}
