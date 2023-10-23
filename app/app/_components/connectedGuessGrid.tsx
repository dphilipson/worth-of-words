import { memo, ReactNode } from "react";
import { Address } from "viem";

import { WORD_LENGTH } from "../_lib/constants";
import { getAttackers, getPlayer, Phase } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";
import GuessGrid, { InputRowProps, ScoredRowProps } from "./guessGrid";

export interface ConnectedGuessGridProps {
  playerAddress: Address;
  currentInput: string;
  isSelfGrid: boolean;
}

export default memo(function ConnectedGuessGrid({
  playerAddress: gridPlayerAddress,
  currentInput,
  isSelfGrid,
}: ConnectedGuessGridProps): ReactNode {
  const {
    playerAddress: currentPlayerAddress,
    lobby,
    validGuessWords,
    secrets,
  } = useLobby();
  const gridPlayer = getPlayer(lobby, gridPlayerAddress);
  const scoredRows: ScoredRowProps[] = gridPlayer.matchHistory.map((guess) => ({
    word: guess.guess,
    colors: guess.matches,
    isFromCurrentPlayer: guess.attacker === currentPlayerAddress,
    isSelfGrid,
  }));
  const inputRows: InputRowProps[] = (() => {
    if (
      lobby.phase === Phase.COMMITING_GUESSES ||
      (lobby.phase === Phase.REVEALING_GUESSES &&
        getPlayer(lobby, currentPlayerAddress).hasCommittedGuess)
    ) {
      if (isSelfGrid) {
        return [];
      }
      return [
        {
          letters: currentInput,
          inputIsInvalid:
            currentInput.length === WORD_LENGTH &&
            !validGuessWords.has(currentInput),
          isFromCurrentPlayer: false,
        },
      ];
    } else if (gridPlayer.hasRevealedMatches) {
      return [];
    } else {
      return getAttackers(lobby, gridPlayerAddress)
        .filter((attacker) => attacker.revealedGuess)
        .map((attacker) => ({
          letters: attacker.revealedGuess!,
          inputIsInvalid: false,
          isFromCurrentPlayer: attacker.address === currentPlayerAddress,
        }));
    }
  })();
  const secretWord = (() => {
    if (!isSelfGrid) {
      return undefined;
    }
    const secretIndex =
      lobby.config.numLives - getPlayer(lobby, currentPlayerAddress).livesLeft;
    return secrets[secretIndex];
  })();

  return (
    <GuessGrid
      scoredRows={scoredRows}
      inputRows={inputRows}
      secretWord={secretWord}
    />
  );
});
