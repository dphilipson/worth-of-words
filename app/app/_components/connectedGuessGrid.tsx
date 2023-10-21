import { memo, ReactNode } from "react";
import { Address } from "viem";

import { WORD_LENGTH } from "../_lib/constants";
import { getAttackers, getPlayer, Phase } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";
import GuessGrid, { InputRowProps, ScoredRowProps } from "./guessGrid";

export interface ConnectedGuessGridProps {
  playerAddress: Address;
  currentInput: string;
}

export default memo(function ConnectedGuessGrid({
  playerAddress: gridPlayerAddress,
  currentInput,
}: ConnectedGuessGridProps): ReactNode {
  const {
    playerAddress: currentPlayerAddress,
    lobby,
    validGuessWords,
  } = useLobby();
  const gridPlayer = getPlayer(lobby, gridPlayerAddress);
  const scoredRows: ScoredRowProps[] = gridPlayer.matchHistory.map((guess) => ({
    word: guess.guess,
    colors: guess.matches,
    isFromCurrentPlayer: guess.attacker === currentPlayerAddress,
  }));
  const inputRows: InputRowProps[] = (() => {
    if (
      lobby.currentPhase === Phase.COMMITING_GUESSES ||
      (lobby.currentPhase === Phase.REVEALING_GUESSES &&
        getPlayer(lobby, currentPlayerAddress).hasCommittedGuess)
    ) {
      return [
        {
          letters: currentInput,
          inputIsInvalid:
            currentInput.length === WORD_LENGTH &&
            !validGuessWords.has(currentInput),
          isFromCurrentPlayer: false,
        },
      ];
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

  return <GuessGrid scoredRows={scoredRows} inputRows={inputRows} />;
});
