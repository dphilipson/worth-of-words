// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {Word, Words} from "../src/Words.sol";

contract WordsTest is Test {
    using Words for Word;

    function test_toString() public {
        Word word = Word.wrap(
            1 * (26 ** 4) + 4 * (26 ** 3) + 2 * (26 ** 2) + 2 * 26 + 0
        );
        assertEq(word.toString(), "BECCA");
    }

    function test_toLetters() public {
        Word word = Word.wrap(
            1 * (26 ** 4) + 4 * (26 ** 3) + 2 * (26 ** 2) + 2 * 26 + 0
        );
        uint32[5] memory actual = word.toLetters();
        uint32[5] memory expected = [uint32(1), 4, 2, 2, 0];
        for (uint32 i = 0; i < 5; i++) {
            assertEq(actual[i], expected[i]);
        }
    }
}
