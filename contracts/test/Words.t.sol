// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import {Word, Words} from "../src/Words.sol";
import {WordTestUtils} from "./WordTestUtils.sol";

contract WordsTest is Test {
    using Words for Word;

    function test_toString() public {
        Word word = WordTestUtils.fromString("HOWDY");
        assertEq(word.toString(), "HOWDY");
    }

    function test_toLetters() public {
        Word word = WordTestUtils.fromString("BECCA");
        uint32[5] memory actual = word.toLetters();
        uint32[5] memory expected = [uint32(1), 4, 2, 2, 0];
        for (uint32 i = 0; i < 5; i++) {
            assertEq(actual[i], expected[i]);
        }
    }
}
