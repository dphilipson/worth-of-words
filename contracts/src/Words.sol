// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IWorthOfWords} from "./IWorthOfWords.sol";

library Words {
    using Words for IWorthOfWords.Word;

    uint8 public constant WORD_LENGTH = 5;
    // Assumes that "AAAAA" isn't a word, which it really shouldn't be.
    IWorthOfWords.Word public constant NULL_WORD = IWorthOfWords.Word.wrap(0);
    uint8 private constant A_IN_ASCII = 65;
    uint8 private constant PUB_SIGNAL_GUESS_START_INDEX = 6;

    function toString(
        IWorthOfWords.Word self
    ) internal pure returns (string memory) {
        bytes memory outBytes = new bytes(WORD_LENGTH);
        uint24 w = IWorthOfWords.Word.unwrap(self);
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            outBytes[WORD_LENGTH - 1 - i] = bytes1(uint8(w % 26) + A_IN_ASCII);
            w /= 26;
        }
        return string(outBytes);
    }

    function toLetters(
        IWorthOfWords.Word self
    ) internal pure returns (uint32[WORD_LENGTH] memory) {
        uint32[WORD_LENGTH] memory letters;
        uint24 w = IWorthOfWords.Word.unwrap(self);
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            letters[WORD_LENGTH - 1 - i] = uint32(w % 26);
            w /= 26;
        }
        return letters;
    }

    function isNull(IWorthOfWords.Word self) internal pure returns (bool) {
        return self.equals(NULL_WORD);
    }

    function equals(
        IWorthOfWords.Word self,
        IWorthOfWords.Word other
    ) internal pure returns (bool) {
        return
            IWorthOfWords.Word.unwrap(self) == IWorthOfWords.Word.unwrap(other);
    }
}
