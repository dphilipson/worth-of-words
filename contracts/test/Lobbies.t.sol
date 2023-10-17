// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/IWorthOfWords.sol";
import {Lobbies} from "../src/Lobbies.sol";
import {WordTestUtils} from "./WordTestUtils.sol";

contract LobbiesTest is Test, Lobbies {
    LobbyId private constant LOBBY_ID = LobbyId.wrap(42);
    address private constant ALICE = address(uint160(1));
    address private constant BOB = address(uint160(2));

    Lobby private lobby;

    function test_runthrough() public {
        this.initialize(getDefaultLobbyConfig());
        ValidWordProof[]
            memory secretWordCommitments = getMammaSecretWordCommitments();
        vm.prank(ALICE);
        this.addPlayer("Alice", bytes32(0), secretWordCommitments);
        vm.prank(BOB);
        this.addPlayer("Bob", bytes32(0), secretWordCommitments);
        vm.prank(ALICE);
        this.startGame();
        Word imams = WordTestUtils.fromString("IMAMS");
        uint256 salt = 1;
        bytes32 guessCommitment = keccak256(abi.encodePacked(imams, salt));
        vm.prank(ALICE);
        this.commitGuess(guessCommitment);
        // Bob doesn't commit in time.
        vm.warp(block.timestamp + 1001);
        bytes32[] memory merkleProof = getImamsMerkleProof();
        vm.prank(ALICE);
        this.revealGuess(imams, salt, merkleProof);
        // Alice doesn't need anything in her matches proof, since Bob didn't
        // get a guess in on time.
        vm.prank(ALICE);
        this.revealMatches(new ScoreGuessProof[](1));
        vm.prank(BOB);
        this.revealMatches(getImamsOnMammaScoreProof());
        // IMAMS against MAMMA has two yellows and one green. With the test
        // config, thats 2 + 10 points.
        assertEq(lobby.playersByAddress[ALICE].score, 12, "wrong score");
        assertEq(lobby.roundNumber, 1, "round should have advanced");
    }

    function initialize(LobbyConfig calldata config) external {
        _initializeLobby(lobby, LOBBY_ID, config);
    }

    function addPlayer(
        string calldata playerName,
        bytes32 password,
        ValidWordProof[] calldata secretWordCommitments
    ) external {
        _addPlayer(
            lobby,
            LOBBY_ID,
            playerName,
            password,
            secretWordCommitments
        );
    }

    function startGame() external {
        _startGame(lobby, LOBBY_ID);
    }

    function commitGuess(bytes32 commitment) external {
        _commitGuess(lobby, LOBBY_ID, commitment);
    }

    function revealGuess(
        Word guess,
        uint256 salt,
        bytes32[] calldata merkleProof
    ) external {
        _revealGuess(lobby, LOBBY_ID, guess, salt, merkleProof);
    }

    function revealMatches(ScoreGuessProof[] calldata proofs) external {
        _revealMatches(lobby, LOBBY_ID, proofs);
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
                maxRounds: 5,
                numLives: 2,
                pointsForYellow: 1,
                pointsForGreen: 10,
                pointsForFullWord: 100,
                pointPenaltyForLosingLife: 1,
                pointsForDroppedOpponent: 200
            });
    }

    /**
     * Proofs for the word "MAMMA". Generated from `printTestData` in the app
     * (frontend) module.
     */
    function getMammaSecretWordCommitments()
        private
        pure
        returns (ValidWordProof[] memory proofs)
    {
        proofs = new ValidWordProof[](2);
        for (uint32 i = 0; i < 2; i++) {
            proofs[i] = ValidWordProof(
                [
                    5867464772186840556131892863832894985645392960127500054486892683820685535397,
                    13682553220618727812134559800673623893246649555837418948293524162520578246322
                ],
                [
                    [
                        2726094359809819990645740848433472707396579329035278628123360037793985800737,
                        9023551802349293670618849177877588335623416562224050437177701129173706804417
                    ],
                    [
                        10196577371336501803509017139443457477010117923926472185026505752617004001151,
                        7667170194398291915000940398155266262880024181214102384088110838920244468749
                    ]
                ],
                [
                    2107705034795918583029340238310343621889618242692555047618994222069317418802,
                    16940101826390903987697967360398154712931521169408391832525321445933264745730
                ],
                [
                    5171736603042482243320905874870331627894653004354088196836570650861053951069,
                    7173236982933911777820733145493173871226223723182762917932632264146841199672
                ]
            );
        }
        return proofs;
    }

    function getImamsMerkleProof()
        private
        pure
        returns (bytes32[] memory proof)
    {
        uint256[14] memory copyPastedProof = [
            0x1cdeb52b0977cd0ae69d8103f4429881c6b1ada8f31e9c8cb7e76f744f4438a6,
            0x0289ee5ac3eedd295b18fc82b3ab658c7c1c4c606d5eb62ebc9ba4ca6fdf8f09,
            0x4b8debac88a2dad8afa3b3ae317a4ffe4942db6cb77cc26e1b4b2cb413f62d7d,
            0x60344acdb2e6a91e4608c0529a277c2c7f0a7cfcb4a0b9b428a9ce5c25ec84da,
            0xd80d474de5835dcb1d1de76071956bb0f5f01ea3b69bced5e91920468bbaf7a7,
            0x1cef46a1c71822b45f843abea30371f6de5feb5fed22d6fa233dc30a18c265fa,
            0x6bc393c84067854c98acfa8ef4f966ae633e0f20b9567daeaff018a48912f051,
            0xc9cff90ec93364ce5af16eee5a702aed40ddbe33b0267eedfd7d42938f17540a,
            0xd6d816cf6ca866a8dd007338cfd57ced49fa04359a471fd1271024451610ca26,
            0x404e7601a4300bceeeee69550122d6695b29c496983c0f7052f8f23e1f4d17aa,
            0x9a0c3eccfb35198dea7201cab45b29ec6b284571d9d6be29e644bdbee55cf544,
            0x3b3b40837c225bcd92973ed2e04a60525ec9435afaaa2fac5cb0aa38f05a83f8,
            0x46dd7cc404a212708da1ce336eddc6a2d0e60863d693f0636230ce7d3e8e72d7,
            0xe82d1736ffaad731fb6545c9e7a4c618dc03f7a221ebff754d101e98196cf409
        ];
        proof = new bytes32[](14);
        for (uint32 i = 0; i < 14; i++) {
            proof[i] = bytes32(copyPastedProof[i]);
        }
        return proof;
    }

    function getImamsOnMammaScoreProof()
        private
        pure
        returns (ScoreGuessProof[] memory proofs)
    {
        proofs = new ScoreGuessProof[](1);
        proofs[0] = ScoreGuessProof(
            [
                5301969868000658697396310561997649807575458765523818387791461452281911122996,
                20874767957779501960974395628649302931877753140358766484175657996148161344967
            ],
            [
                [
                    9537404683050324715340052646948040936160078688793783514569851109435260926326,
                    9018235337191429907731051205592880498340390733645934934168162176468118729256
                ],
                [
                    21342259992825453858805043626787888506454162417661729416624936893791342016158,
                    14364973220933639838169025413536906763896440846008517520281335991290862855966
                ]
            ],
            [
                16221649677286850427230532527753650756055218094032876845356730776261684153982,
                5067690487716801048462946155703919636088680931163733377129346305560780250499
            ],
            [
                5171736603042482243320905874870331627894653004354088196836570650861053951069,
                0,
                1,
                1,
                2,
                0,
                8,
                12,
                0,
                12,
                18
            ]
        );
        return proofs;
    }
}
