// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ShortString, ShortStrings} from "@openzeppelin/contracts/utils/ShortStrings.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IWorthOfWords as Wow} from "./IWorthOfWords.sol";

library Lobbies {
    using Lobbies for Lobby;
    using EnumerableSet for EnumerableSet.AddressSet;
    using ShortStrings for *;

    struct Lobby {
        Wow.LobbyConfig config;
        Player[] players;
        mapping(address => uint256) indexesByPlayerAddress;
        address[] livePlayerAddresses;
        EnumerableSet.AddressSet[] playerAddressesWithUnrevealedMatchesByRound;
        uint32 roundNumber;
        uint48 phaseDeadline;
    }

    struct Player {
        ShortString name;
        Life[] lives;
    }

    struct Life {
        uint256 commitment;
        Guess[] guesses;
    }

    struct Guess {
        Wow.Word word;
        Wow.LetterMatch[5] matches;
    }

    function addPlayer(
        Lobby storage self,
        string calldata playerName,
        bytes32 password,
        Wow.ValidWordProof[] calldata secretWordCommitments
    ) internal {
        self._verifyPassword(password);
        // TODO
    }

    function startGame(Lobby storage self) internal {}

    function commitGuess(Lobby storage self, bytes32 commitment) internal {}

    function revealGuess(
        Lobby storage self,
        Wow.Word guess,
        uint256 salt
    ) internal {}

    function revealMatches(
        Lobby storage self,
        Wow.ScoreGuessProof calldata proof
    ) internal {}

    function eliminateUnrevealedPlayers(Lobby storage self) internal {}

    function getConfig(
        Lobby storage self
    ) internal view returns (Wow.LobbyConfig memory) {
        revert("not implemented");
    }

    function getState(
        Lobby storage self
    ) internal view returns (Wow.LobbyState memory) {
        revert("not implemented");
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
            revert Wow.IncorrectLobbyPassword();
        }
    }
}
