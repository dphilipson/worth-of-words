// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import {Word} from "../src/IWorthOfWords.sol";

library WordTestUtils {
    uint8 private constant WORD_LENGTH = 5;
    uint8 private constant A_IN_ASCII = 65;

    function fromString(string memory s) internal pure returns (Word) {
        bytes memory bs = bytes(s);
        uint24 word;
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            word = 26 * word + uint24(uint8(bs[i]) - A_IN_ASCII);
        }
        return Word.wrap(word);
    }
}
