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
        uint32 remainingPlayersInRound;
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

    uint256 constant NUM_TARGETS = 3;

    modifier requirePhase(Lobby storage self, IWorthOfWords.Phase phase) {
        if (phase != self.currentPhase) {
            revert IWorthOfWords.WrongPhase(phase, self.currentPhase);
        }
        _;
    }

    function initialize(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        IWorthOfWords.LobbyConfig calldata config
    ) internal {
        // TODO
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
            revert IWorthOfWords.LobbyIsFull(uint256(self.config.maxPlayers));
        }
        if (secretWordCommitments.length != self.config.numLives) {
            revert IWorthOfWords.WrongNumberOfSecretWords(
                secretWordCommitments.length,
                self.config.numLives
            );
        }
        self._verifyPassword(password);
        for (uint256 i = 0; i < secretWordCommitments.length; i++) {
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
        for (uint256 i = 0; i < secretWordCommitments.length; i++) {
            player.secretWordCommitments.push() = secretWordCommitments[i]
                ._pubSignals[0];
        }
        // TOOD: update other storage fields

        emit IWorthOfWords.JoinedLobby(lobbyId, msg.sender, playerName);
    }

    function startGame(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId
    ) internal requirePhase(self, IWorthOfWords.Phase.NotStarted) {}

    function commitGuess(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        bytes32 commitment
    ) internal requirePhase(self, IWorthOfWords.Phase.CommittingGuesses) {}

    function revealGuess(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        IWorthOfWords.Word guess,
        uint256 salt
    ) internal requirePhase(self, IWorthOfWords.Phase.RevealingGuesses) {}

    function revealMatches(
        Lobby storage self,
        IWorthOfWords.LobbyId lobbyId,
        IWorthOfWords.ScoreGuessProof[] calldata proofs
    ) internal requirePhase(self, IWorthOfWords.Phase.RevealingMatches) {}

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
        uint256 proofIndex,
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
    ) internal view returns (uint256[] memory) {
        uint256 playerCount = self._getLivePlayerCount();
        if (playerCount <= NUM_TARGETS + 1) {
            // All opponents are targets.
            uint256[] memory offsets = new uint256[](playerCount - 1);
            for (uint256 i = 0; i < playerCount - 1; i++) {
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

    function _chooseRandomishOffsets(
        uint256 playerCount,
        uint32 randomishSeed,
        uint32 roundNumber,
        uint256 numOffsets
    ) internal pure returns (uint256[] memory) {
        uint256[] memory offsets = new uint256[](numOffsets);
        uint32 salt = 0;
        for (uint256 i = 0; i < numOffsets; i++) {
            while (true) {
                bytes32 randomishHash = keccak256(
                    abi.encodePacked(randomishSeed, roundNumber, salt++)
                );
                uint256 offset = (uint256(randomishHash) % (playerCount - 1)) +
                    1;
                if (!_arrayContainsBeforeIndex(offsets, offset, i)) {
                    offsets[i] = offset;
                    break;
                }
            }
        }
        return offsets;
    }

    function _arrayContainsBeforeIndex(
        uint256[] memory array,
        uint256 x,
        uint256 indexBound
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < indexBound; i++) {
            if (array[i] == x) {
                return true;
            }
        }
        return false;
    }

    function _getLivePlayerCount(
        Lobby storage self
    ) internal view returns (uint256) {
        return self.livePlayerAddressesByRound[self.roundNumber].length();
    }
}
