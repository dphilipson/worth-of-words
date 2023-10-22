// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import {Color, MatchHistory, Scoring} from "../src/Scoring.sol";

contract ScoringTest is Test {
    using Scoring for MatchHistory;

    function test_scoringNewYellows() public {
        uint32 newYellowCount;
        MatchHistory history = MatchHistory.wrap(0).accumulateMatches(
            [uint32(1), 1, 2, 3, 4],
            [Color.Yellow, Color.Yellow, Color.Gray, Color.Gray, Color.Gray]
        );
        (newYellowCount, ) = history.scoreMatches(
            [uint32(0), 1, 0, 1, 1],
            [Color.Gray, Color.Yellow, Color.Gray, Color.Yellow, Color.Yellow]
        );
        assertEq(newYellowCount, 1, "one more yellow");
        (newYellowCount, ) = history.scoreMatches(
            [uint32(0), 1, 0, 1, 1],
            [Color.Gray, Color.Yellow, Color.Gray, Color.Yellow, Color.Green]
        );
        assertEq(newYellowCount, 1, "one more yellow, but also a new green");
        (newYellowCount, ) = history.scoreMatches(
            [uint32(0), 1, 2, 1, 1],
            [Color.Yellow, Color.Yellow, Color.Yellow, Color.Green, Color.Gray]
        );
        assertEq(newYellowCount, 2, "two different new letters");
        // This next case tests a bugfix.
        (newYellowCount, ) = history.scoreMatches(
            [uint32(5), 5, 6, 0, 0],
            [Color.Yellow, Color.Green, Color.Yellow, Color.Gray, Color.Gray]
        );
        assertEq(
            newYellowCount,
            2,
            "a new yellow and green in one letter, yellow in another"
        );
    }

    function test_scoringNewGreens() public {
        uint32 newGreenCount;
        MatchHistory history = MatchHistory.wrap(0).accumulateMatches(
            [uint32(1), 1, 2, 3, 4],
            [Color.Yellow, Color.Green, Color.Gray, Color.Gray, Color.Gray]
        );
        (, newGreenCount) = history.scoreMatches(
            [uint32(0), 1, 0, 1, 1],
            [Color.Green, Color.Green, Color.Gray, Color.Yellow, Color.Yellow]
        );
        assertEq(newGreenCount, 1, "one more green");
        // Same thing but the original green isn't green anymore.
        (, newGreenCount) = history.scoreMatches(
            [uint32(0), 1, 0, 1, 1],
            [Color.Green, Color.Yellow, Color.Gray, Color.Gray, Color.Gray]
        );
        assertEq(
            newGreenCount,
            1,
            "one more green, but first green isn't anymore"
        );
        // Everything green (four new discoveries).
        (, newGreenCount) = history.scoreMatches(
            [uint32(0), 1, 2, 1, 1],
            [Color.Green, Color.Green, Color.Green, Color.Green, Color.Green]
        );
        assertEq(newGreenCount, 4, "everything is green!");
    }

    function test_accumulateMatches() public {
        MatchHistory history = MatchHistory.wrap(0).accumulateMatches(
            [uint32(1), 4, 2, 2, 0], // "BECCA"
            [Color.Gray, Color.Yellow, Color.Green, Color.Yellow, Color.Gray]
        );
        assertEq(history.getMaxColorsForLetter(10), 0);
        assertEq(history.getMaxColorsForLetter(1), 0);
        assertEq(history.getMaxColorsForLetter(4), 1);
        assertEq(history.getMaxColorsForLetter(2), 2);
        assertFalse(history.hasSeenGreenAtPosition(0));
        assertFalse(history.hasSeenGreenAtPosition(1));
        assertTrue(history.hasSeenGreenAtPosition(2));
        history = history.accumulateMatches(
            [uint32(3), 4, 4, 2, 4], // "DEECE"
            [Color.Green, Color.Yellow, Color.Yellow, Color.Yellow, Color.Gray]
        );
        assertEq(history.getMaxColorsForLetter(3), 1);
        assertEq(history.getMaxColorsForLetter(4), 2);
        // Retained from previous guess.
        assertEq(history.getMaxColorsForLetter(2), 2);
        assertTrue(history.hasSeenGreenAtPosition(0));
        assertFalse(history.hasSeenGreenAtPosition(1));
        // Retained from previous guess.
        assertTrue(history.hasSeenGreenAtPosition(2));
    }
}
