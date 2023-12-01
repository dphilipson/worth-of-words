// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import "./IWorthOfWords.sol";
import {Lobbies} from "./Lobbies.sol";

contract WorthOfWords is IWorthOfWords, Lobbies {
    Lobby[] private _lobbies;

    function createLobby(
        LobbyConfig calldata config
    ) external override returns (LobbyId) {
        LobbyId lobbyId = LobbyId.wrap(_lobbies.length);
        Lobby storage lobby = _lobbies.push();
        _initializeLobby(lobby, lobbyId, config);
        return lobbyId;
    }

    function joinLobby(
        LobbyId lobbyId,
        string calldata playerName,
        bytes calldata password,
        ValidWordsProof calldata secretWordsCommitment
    ) external override {
        _addPlayer(
            _getLobby(lobbyId),
            lobbyId,
            playerName,
            password,
            secretWordsCommitment
        );
    }

    function startGame(LobbyId lobbyId) external override {
        _startGame(_getLobby(lobbyId), lobbyId);
    }

    function commitGuess(
        LobbyId lobbyId,
        bytes32 commitment
    ) external override {
        _commitGuess(_getLobby(lobbyId), lobbyId, commitment);
    }

    function revealGuess(
        LobbyId lobbyId,
        Word guess,
        uint256 salt,
        bytes32[] calldata merkleProof
    ) external override {
        _revealGuess(_getLobby(lobbyId), lobbyId, guess, salt, merkleProof);
    }

    function revealMatches(
        LobbyId lobbyId,
        ScoreGuessesProof calldata proof
    ) external override {
        _revealMatches(_getLobby(lobbyId), lobbyId, proof);
    }

    function endRevealMatchesPhase(LobbyId lobbyId) external override {
        _endRevealMatchesPhase(_getLobby(lobbyId), lobbyId);
    }

    function getLobbyConfig(
        LobbyId lobbyId
    ) external view override returns (LobbyConfig memory) {
        return _getLobby(lobbyId).config;
    }

    function isValidLobbyPassword(
        LobbyId lobbyId,
        bytes calldata password
    ) external view override returns (bool) {
        return _isValidPassword(_getLobby(lobbyId), password);
    }

    function _getLobby(LobbyId lobbyId) private view returns (Lobby storage) {
        uint256 lobbyIndex = LobbyId.unwrap(lobbyId);
        if (_lobbies.length <= lobbyIndex) {
            revert LobbyDoesNotExist();
        }
        return _lobbies[lobbyIndex];
    }
}
