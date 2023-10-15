// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IWorthOfWords} from "./IWorthOfWords.sol";

library Words {
    uint8 public constant WORD_LENGTH = 5;
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

    /**
     * This is very specialized to the one particular case we need it for:
     * checking that the public signals of a score match proof are indeed
     * referencing the guess to which it should be responding. In such a proof,
     * the guess letters are the public signals at indices [6, 11).
     */
    function equalsPublicSignalSlice(
        IWorthOfWords.Word self,
        uint256[11] calldata pubSignals
    ) internal pure returns (bool) {
        uint24 w = IWorthOfWords.Word.unwrap(self);
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            if (
                pubSignals[
                    PUB_SIGNAL_GUESS_START_INDEX + WORD_LENGTH - 1 - i
                ] != uint256(w % 26)
            ) {
                return false;
            }
            w /= 26;
        }
        return true;
    }
}
