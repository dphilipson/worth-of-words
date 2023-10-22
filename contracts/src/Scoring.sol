// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import {Color} from "./IWorthOfWords.sol";

/**
 * Representation: the three bits at 3 * i are the maximum colors seen for a
 * given letter. The five bits at 3 * 26 are whether a green has been seen at
 * each position.
 */
type MatchHistory is uint88;

library Scoring {
    using Scoring for MatchHistory;

    uint32 private constant WORD_LENGTH = 5;
    uint32 private constant SEEN_GREEN_OFFSET = 78; // 26 * 3

    function scoreMatches(
        MatchHistory self,
        uint32[WORD_LENGTH] memory guess,
        Color[WORD_LENGTH] memory matches
    ) internal pure returns (uint32 newYellowCount, uint32 newGreenCount) {
        newYellowCount = self._getNewYellowCount(guess, matches);
        newGreenCount = self._getNewGreenCount(matches);
    }

    function accumulateMatches(
        MatchHistory self,
        uint32[WORD_LENGTH] memory guess,
        Color[WORD_LENGTH] memory matches
    ) internal pure returns (MatchHistory) {
        self = self._updateMaxColorsForLetters(guess, matches);
        return self._updateSeenGreens(matches);
    }

    function getMaxColorsForLetter(
        MatchHistory self,
        uint32 letter
    ) internal pure returns (uint32 count) {
        return uint32((MatchHistory.unwrap(self) >> (3 * letter)) & 7);
    }

    function hasSeenGreenAtPosition(
        MatchHistory self,
        uint32 position
    ) internal pure returns (bool) {
        return
            MatchHistory.unwrap(self) & (1 << (SEEN_GREEN_OFFSET + position)) !=
            0;
    }

    function _setMaxColorsForLetter(
        MatchHistory self,
        uint32 letter,
        uint32 count
    ) internal pure returns (MatchHistory) {
        return
            MatchHistory.wrap(
                (MatchHistory.unwrap(self) & uint88(~(7 << (3 * letter)))) |
                    (count << (3 * letter))
            );
    }

    function _getNewYellowCount(
        MatchHistory self,
        uint32[WORD_LENGTH] memory guess,
        Color[WORD_LENGTH] memory matches
    ) internal pure returns (uint32) {
        uint32[WORD_LENGTH] memory colorCounts = _getLetterColorCounts(
            guess,
            matches
        );
        uint32 count;
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            uint32 currentColorCount = colorCounts[i];
            uint32 previousColorCount = self.getMaxColorsForLetter(guess[i]);
            if (currentColorCount <= previousColorCount) {
                continue;
            }
            uint32 yellowCountForLetter = _getYellowCountForLetter(
                guess,
                matches,
                guess[i]
            );
            count += _min(
                currentColorCount - previousColorCount,
                yellowCountForLetter
            );
        }
        return count;
    }

    function _getNewGreenCount(
        MatchHistory self,
        Color[WORD_LENGTH] memory matches
    ) internal pure returns (uint32) {
        uint32 count;
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            if (matches[i] == Color.Green && !self.hasSeenGreenAtPosition(i)) {
                count++;
            }
        }
        return count;
    }

    function _updateMaxColorsForLetters(
        MatchHistory self,
        uint32[WORD_LENGTH] memory guess,
        Color[WORD_LENGTH] memory matches
    ) internal pure returns (MatchHistory) {
        uint32[WORD_LENGTH] memory colorCounts = _getLetterColorCounts(
            guess,
            matches
        );
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            self = self._updateMaxColorsForSingleLetter(
                guess[i],
                colorCounts[i]
            );
        }
        return self;
    }

    function _updateMaxColorsForSingleLetter(
        MatchHistory self,
        uint32 letter,
        uint32 count
    ) internal pure returns (MatchHistory) {
        if (count == 0) {
            return self;
        }
        uint32 current = self.getMaxColorsForLetter(letter);
        return
            count > current ? self._setMaxColorsForLetter(letter, count) : self;
    }

    function _updateSeenGreens(
        MatchHistory self,
        Color[WORD_LENGTH] memory matches
    ) internal pure returns (MatchHistory) {
        uint88 h = MatchHistory.unwrap(self);
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            if (matches[i] == Color.Green) {
                h |= uint88(1 << (SEEN_GREEN_OFFSET + i));
            }
        }
        return MatchHistory.wrap(h);
    }

    /**
     * Returns how many times each letter of the guess appears as yellow or
     * green, stored at the *first* occurrance of the letter (even if that
     * occurance is gray). For example, if the guess is "MAMMA" and the last
     * three letters are hits, then the output would be 21000, since M is
     * colored twice which is stored at the position of the first M, likewise
     * for A.
     */
    function _getLetterColorCounts(
        uint32[WORD_LENGTH] memory guess,
        Color[WORD_LENGTH] memory matches
    ) private pure returns (uint32[WORD_LENGTH] memory) {
        uint32[WORD_LENGTH] memory counts;
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            uint32 count = 0;
            for (uint32 j = 0; j < WORD_LENGTH; j++) {
                if (guess[i] == guess[j]) {
                    if (j < i) {
                        // The letter at i appeared earlier in the word and had
                        // its colors counted then.
                        count = 0;
                        break;
                    }
                    if (matches[j] != Color.Gray) {
                        count++;
                    }
                }
            }
            counts[i] = count;
        }
        return counts;
    }

    function _getYellowCountForLetter(
        uint32[WORD_LENGTH] memory guess,
        Color[WORD_LENGTH] memory matches,
        uint32 letter
    ) private pure returns (uint32 count) {
        for (uint32 i = 0; i < WORD_LENGTH; i++) {
            if (guess[i] == letter && matches[i] == Color.Yellow) {
                count++;
            }
        }
        return count;
    }

    function _min(uint32 a, uint32 b) private pure returns (uint32) {
        return a < b ? a : b;
    }
}
