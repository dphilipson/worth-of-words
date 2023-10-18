import { memo, ReactNode, useCallback, useState } from "react";

import { WORD_LENGTH } from "../_lib/constants";
import GuessGrid, { GuessRowProps } from "./guessGrid";
import KeyboardCapture from "./keyboardCapture";
import { PlayerListItemPropsInList } from "./playerList";
import PlayerListItem from "./playerListItem";

export interface GuessingViewProps {
  opponents: Opponent[];
  maxLives: number;
  validGuesses: Set<string>;
  onSubmitGuess(guess: string): void;
}

export interface Opponent extends PlayerListItemPropsInList {
  rows: GuessRowProps[];
}

export default memo(function GuessingView({
  opponents,
  maxLives,
  validGuesses,
  onSubmitGuess,
}: GuessingViewProps): ReactNode {
  const [guess, setGuess] = useState("");
  const isInvalidGuess =
    guess.length === WORD_LENGTH && !validGuesses.has(guess);

  const submit = useCallback(
    () => onSubmitGuess(guess),
    [onSubmitGuess, guess],
  );

  return (
    <div className="flex w-full flex-col items-center">
      <KeyboardCapture
        value={guess}
        onValueChange={setGuess}
        onSubmit={submit}
      />
      <div className="flex w-full justify-around">
        {opponents.map(({ rows, ...listItemProps }) => (
          <div
            key={listItemProps.address}
            className="flex w-full max-w-xs flex-col items-center space-y-4"
          >
            <PlayerListItem
              className="rounded-md shadow-xl"
              {...listItemProps}
              maxLives={maxLives}
              isCurrentPlayer={false}
            />
            <GuessGrid
              rows={rows}
              input={guess}
              isInvalidWord={isInvalidGuess}
            />
          </div>
        ))}
      </div>
      <div className="prose">
        <h3>Enter a guess!</h3>
      </div>
    </div>
  );
});
