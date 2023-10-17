// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/IWorthOfWords.sol";
import {Lobbies} from "../src/Lobbies.sol";

contract LobbiesTest is Lobbies, Test {
    LobbyId private constant LOBBY_ID = LobbyId.wrap(42);
    address private constant PLAYER_1 = address(uint160(1));
    address private constant PLAYER_2 = address(uint160(2));

    Lobby private lobby;

    function test_blarg() public {
        initialize(getDefaultLobbyConfig());
        assertEq(lobby.config.maxPlayers, 2);
    }

    function initialize(LobbyConfig memory config) private {
        this._initializeLobbyHelper(config);
    }

    function getDefaultLobbyConfig() private pure returns (LobbyConfig memory) {
        return
            LobbyConfig({
                secretWordMerkleRoot: 0xfdbe8835fd6ad7b4a03d89ce621ab3a1fb4c990b687e77b5d502b3f09df6438,
                privateGamePublicKey: 0,
                minPlayers: 2,
                maxPlayers: 2,
                guessWordMerkleRoot: bytes32(
                    0x3d7f08c5bb8f1ce2219d2ee5eb6f26d3400fd98ef774c2d74c1e03931692360d
                ),
                maxCommitGuessTime: 1000,
                maxRevealGuessTime: 1000,
                maxRevealMatchesTime: 1000,
                maxRounds: 2,
                numLives: 2,
                pointsForYellow: 1,
                pointsForGreen: 10,
                pointsForFullWord: 100,
                pointPenaltyForLosingLife: 1,
                pointsForDroppedOpponent: 200
            });
    }

    function _initializeLobbyHelper(LobbyConfig calldata config) external {
        _initializeLobby(lobby, LOBBY_ID, config);
    }
}
