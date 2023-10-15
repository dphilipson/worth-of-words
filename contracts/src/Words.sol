// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IWorthOfWords} from "./IWorthOfWords.sol";

library Words {
    uint8 public constant WORD_LENGTH = 5;
    uint8 private constant A_IN_ASCII = 65;

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
}
