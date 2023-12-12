// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

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
        vm.prank(ALICE);
        this.initialize(getDefaultLobbyConfig());
        ValidWordsProof
            memory secretWordsCommitment = getMammaSecretWordsCommitment();
        vm.prank(ALICE);
        this.addPlayer("Alice", bytes(""), secretWordsCommitment);
        vm.prank(BOB);
        this.addPlayer("Bob", bytes(""), secretWordsCommitment);
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
        // Alice can put any valid proof in, since Bob didn't submit on time.
        // In a real game, she'd submit a proof for a dummy non-matching guess,
        // but we'll just reuse the same proof as Bob's for this test.
        ScoreGuessesProof memory scoreProof = getImamsOnMammaScoreProof();
        vm.prank(ALICE);
        this.revealMatches(scoreProof);
        vm.prank(BOB);
        this.revealMatches(scoreProof);
        // IMAMS against MAMMA has two yellows and one green. With the test
        // config, thats 2 + 10 points.
        assertEq(
            lobby.playersByAddress[ALICE].score,
            12,
            "wrong score for Alice"
        );
        // Bob should get no points because he didn't submit a guess.
        assertEq(lobby.playersByAddress[BOB].score, 0, "wrong score for Bob");
        assertEq(lobby.roundNumber, 1, "round should have advanced");
    }

    function initialize(LobbyConfig calldata config) external {
        _initializeLobby(lobby, LOBBY_ID, config);
    }

    function addPlayer(
        string calldata playerName,
        bytes calldata password,
        ValidWordsProof calldata secretWordsCommitment
    ) external {
        _addPlayer(
            lobby,
            LOBBY_ID,
            playerName,
            password,
            secretWordsCommitment
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

    function revealMatches(ScoreGuessesProof calldata proof) external {
        _revealMatches(lobby, LOBBY_ID, proof);
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
                pointsForFullWord: 100
            });
    }

    /**
     * Proof for the word "MAMMA" and two others not used in this test.
     * Generated from `printTestData` in the app (frontend) module.
     */
    function getMammaSecretWordsCommitment()
        private
        pure
        returns (ValidWordsProof memory)
    {
        return
            ValidWordsProof(
                [
                    17881595491463269564028249543491327440928342057208551375603995221815423818362,
                    13731895407756928260451318329930734688585234889194182604340302047082970113064
                ],
                [
                    [
                        10041729348039128096846126424245821030280463087898957209323267876832189337229,
                        4585173980328929416560052129055439130840871716497738781184710780744001411657
                    ],
                    [
                        2073478311500690531758885553064726059849489367930319487872664731113310725767,
                        1671061633064024332847138202429134250370577539303100503152382948003779992620
                    ]
                ],
                [
                    1227574819873297095949033528010595514908399406658348126919702485914703415683,
                    11684528560275350585037846583396184014992507441463324031984922255681160841032
                ],
                [
                    5171736603042482243320905874870331627894653004354088196836570650861053951069,
                    8561268086786338597719598234748529167157446697220990872578671534870233569341,
                    10366956229969468420673216372240379198377488389397733760441536651340128113246,
                    7173236982933911777820733145493173871226223723182762917932632264146841199672
                ]
            );
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
        returns (ScoreGuessesProof memory)
    {
        return
            ScoreGuessesProof(
                [
                    15693239736464155968943120648313727508491978725751295945152830771130753012582,
                    9764223623244957491282176177134973110395736897559787596874877041253769484354
                ],
                [
                    [
                        3488833506423774319360670602070037271224240358954407852260427213742871500625,
                        2893461148445015230262491105662613756517495680284484997509679004510422945192
                    ],
                    [
                        638883980693004260327686765048482955791133217504465860210714550850825747765,
                        16332317062985708606605983089533126610969069843277862487364725643788024838442
                    ]
                ],
                [
                    3363024327997736643710643267981701686192711446567955247724498059633144479480,
                    3726766078545050752983425371113336650661259272508959025235662413574467496086
                ],
                [
                    5171736603042482243320905874870331627894653004354088196836570650861053951069,
                    0,
                    1,
                    1,
                    2,
                    0,
                    2,
                    0,
                    0,
                    0,
                    0,
                    0,
                    2,
                    0,
                    0,
                    0,
                    8,
                    12,
                    0,
                    12,
                    18,
                    12,
                    14,
                    14,
                    2,
                    7,
                    15,
                    0,
                    11,
                    4,
                    14
                ]
            );
    }
}
