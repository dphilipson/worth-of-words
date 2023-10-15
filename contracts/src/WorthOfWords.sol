// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IWorthOfWords} from "./IWorthOfWords.sol";
import {Lobbies} from "./Lobbies.sol";

contract WorthOfWords is IWorthOfWords {
    using Lobbies for Lobbies.Lobby;

    mapping(LobbyId => Lobbies.Lobby) private _lobbiesById;

    function createLobby(
        LobbyConfig calldata config
    ) external override returns (LobbyId) {
        revert("not implemented");
    }

    function joinLobby(
        LobbyId lobbyId,
        string calldata playerName,
        bytes32 password,
        ValidWordProof[] calldata secretWordCommitments
    ) external override {
        _getLobby(lobbyId).addPlayer(
            playerName,
            password,
            secretWordCommitments
        );
    }

    function startGame(LobbyId lobbyId) external override {
        _getLobby(lobbyId).startGame();
    }

    function commitGuess(
        LobbyId lobbyId,
        bytes32 commitment
    ) external override {}

    function revealGuess(
        LobbyId lobbyId,
        Word guess,
        uint256 salt
    ) external override {
        _getLobby(lobbyId).revealGuess(guess, salt);
    }

    function revealMatches(
        LobbyId lobbyId,
        ScoreGuessProof calldata proof
    ) external override {
        _getLobby(lobbyId).revealMatches(proof);
    }

    function eliminateUnrevealedPlayers(LobbyId lobbyId) external override {
        _getLobby(lobbyId).eliminateUnrevealedPlayers();
    }

    function getLobbyConfig(
        LobbyId lobbyId
    ) external view override returns (LobbyConfig memory) {
        return _getLobby(lobbyId).getConfig();
    }

    function getLobbyState(
        LobbyId lobbyId
    ) external view override returns (LobbyState memory) {
        return _getLobby(lobbyId).getState();
    }

    function _getLobby(
        LobbyId lobbyId
    ) private view returns (Lobbies.Lobby storage) {
        Lobbies.Lobby storage lobby = _lobbiesById[lobbyId];
        if (lobby.config.secretWordMerkleRoot == 0) {
            revert LobbyDoesNotExist();
        }
        return lobby;
    }
}
