// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "./IWorthOfWords.sol";
import {Lobbies, Lobby} from "./Lobbies.sol";

contract WorthOfWords is IWorthOfWords {
    using Lobbies for Lobby;

    Lobby[] private _lobbies;

    function createLobby(
        LobbyConfig calldata config
    ) external override returns (LobbyId) {
        LobbyId lobbyId = LobbyId.wrap(_lobbies.length);
        Lobby storage lobby = _lobbies.push();
        lobby.initializeLobby(lobbyId, config);
        return lobbyId;
    }

    function joinLobby(
        LobbyId lobbyId,
        string calldata playerName,
        bytes32 password,
        ValidWordProof[] calldata secretWordCommitments
    ) external override {
        _getLobby(lobbyId).addPlayer(
            lobbyId,
            playerName,
            password,
            secretWordCommitments
        );
    }

    function startGame(LobbyId lobbyId) external override {
        _getLobby(lobbyId).startGame(lobbyId);
    }

    function commitGuess(
        LobbyId lobbyId,
        bytes32 commitment
    ) external override {
        _getLobby(lobbyId).commitGuess(lobbyId, commitment);
    }

    function revealGuess(
        LobbyId lobbyId,
        Word guess,
        uint256 salt,
        bytes32[] calldata merkleProof
    ) external override {
        _getLobby(lobbyId).revealGuess(lobbyId, guess, salt, merkleProof);
    }

    function revealMatches(
        LobbyId lobbyId,
        ScoreGuessProof[] calldata proofs
    ) external override {
        _getLobby(lobbyId).revealMatches(lobbyId, proofs);
    }

    function endRevealMatchesPhase(LobbyId lobbyId) external override {
        _getLobby(lobbyId).endRevealMatchesPhase(lobbyId);
    }

    function getLobbyConfig(
        LobbyId lobbyId
    ) external view override returns (LobbyConfig memory) {
        return _getLobby(lobbyId).config;
    }

    function _getLobby(LobbyId lobbyId) private view returns (Lobby storage) {
        uint256 lobbyIndex = LobbyId.unwrap(lobbyId);
        if (_lobbies.length <= lobbyIndex) {
            revert LobbyDoesNotExist();
        }
        return _lobbies[lobbyIndex];
    }
}
