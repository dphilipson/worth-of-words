// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IWorthOfWords} from "./IWorthOfWords.sol";

library Scoring {
    using Scoring for Scoring.MatchHistory;

    /**
     * Representation: the three bits at 3 * i are the maximum colors seen for
     * a given letter. The five bits at 3 * 26 are whether a green has been seen
     * at each position.
     */
    type MatchHistory is uint88;

    function scoreMatches(
        MatchHistory initialHistory,
        uint256[5] memory guess,
        IWorthOfWords.Color[5] memory matches
    ) internal pure returns (uint32 newYellowCount, uint32 newGreenCount) {}

    function accumulateMatches(
        MatchHistory self,
        IWorthOfWords.Color[5] memory matches
    ) internal pure returns (MatchHistory) {}

    function _getMaxColorsForLetter(
        MatchHistory self,
        uint32 letter
    ) internal pure returns (uint32 count) {}

    function _setMaxColorsForLetter(
        MatchHistory self,
        uint32 letter,
        uint32 count
    ) internal pure returns (MatchHistory) {}

    function _hasSeenGreenAtPosition(
        MatchHistory self,
        uint32 position
    ) internal pure returns (bool) {}

    function _updateMaxColorsForLetter(
        MatchHistory self,
        uint32 letter,
        uint32 count
    ) internal pure returns (MatchHistory) {
        uint32 current = self._getMaxColorsForLetter(letter);
        return
            count > current ? self._setMaxColorsForLetter(letter, count) : self;
    }

    function _updateHasSeenGreenAtPosition(
        MatchHistory self,
        IWorthOfWords.Color[5] memory matches
    ) internal pure returns (MatchHistory) {
        uint88 h = MatchHistory.unwrap(self);
        for (uint32 i = 0; i < 5; i++) {
            if (matches[i] == IWorthOfWords.Color.Green) {
                h &= uint88(1 << (78 + i));
            }
        }
        return MatchHistory.wrap(h);
    }

    function _getLetterColorCounts(
        uint256[5] memory guess
    ) internal pure returns (uint32) {}
}
