// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IWorthOfWords, LobbyConfig, LobbyId, LobbyState, ScoreGuessProof, ValidWordProof, Word} from "./IWorthOfWords.sol";

struct LobbyStorage {
    LobbyConfig config;
}

library Lobbies {
    function addPlayer(
        LobbyStorage storage self,
        string calldata playerName,
        bytes32 password,
        ValidWordProof[] calldata secretWordCommitments
    ) internal {}

    function commitGuess(
        LobbyStorage storage self,
        bytes32 commitment
    ) internal {}

    function revealGuess(
        LobbyStorage storage self,
        Word guess,
        uint256 salt
    ) internal {}

    function revealMatches(
        LobbyStorage storage self,
        ScoreGuessProof calldata proof
    ) internal {}

    function eliminateUnrevealedPlayers(LobbyStorage storage self) internal {}

    function getConfig(
        LobbyStorage storage self
    ) internal view returns (LobbyConfig memory) {
        revert("not implemented");
    }

    function getState(
        LobbyStorage storage self
    ) internal view returns (LobbyState memory) {
        revert("not implemented");
    }
}
