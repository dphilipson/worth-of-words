// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import {Word} from "./IWorthOfWords.sol";

library Words {
    using Words for Word;

    uint8 public constant WORD_LENGTH = 5;
    uint8 private constant A_IN_ASCII = 65;

    function toString(Word self) internal pure returns (string memory) {
        bytes memory outBytes = new bytes(WORD_LENGTH);
        uint24 w = Word.unwrap(self);
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            outBytes[WORD_LENGTH - 1 - i] = bytes1(uint8(w % 26) + A_IN_ASCII);
            w /= 26;
        }
        return string(outBytes);
    }

    function toLetters(Word self) internal pure returns (uint32[WORD_LENGTH] memory) {
        uint32[WORD_LENGTH] memory letters;
        uint24 w = Word.unwrap(self);
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            letters[WORD_LENGTH - 1 - i] = uint32(w % 26);
            w /= 26;
        }
        return letters;
    }
}
