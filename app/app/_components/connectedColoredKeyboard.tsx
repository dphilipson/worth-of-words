import { memo, ReactNode, useMemo } from "react";

import { Color, getSortedDefenders, ScoredGuess } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";
import ColoredKeyboard from "./coloredKeyboard";

export interface ConnectedColoredKeyboardProps {
  selectedIndex: number | undefined;
  disabled: boolean;
  onKey(keyCode: string): void;
}

export default memo(function ConnectedColoredKeyboard({
  selectedIndex,
  disabled,
  onKey,
}: ConnectedColoredKeyboardProps): ReactNode {
  const { playerAddress, lobby } = useLobby();

  const colorsByLetter = useMemo(
    () =>
      getSortedDefenders(lobby, playerAddress).map((defender) =>
        colorsFromMatchHistory(defender.matchHistory),
      ),
    [playerAddress, lobby],
  );

  return (
    <ColoredKeyboard
      colorsByLetter={colorsByLetter}
      selectedIndex={selectedIndex}
      disabled={disabled}
      onKey={onKey}
    />
  );
});

function colorsFromMatchHistory(
  matchHistory: ScoredGuess[],
): Map<string, Color> {
  const out = new Map<string, Color>();
  for (const { guess, matches } of matchHistory) {
    matches.forEach((color, i) => {
      const letter = guess[i];
      const previousColor = out.get(letter);
      out.set(letter, maxOfColors(previousColor, color));
    });
  }
  return out;
}

function maxOfColors(a: Color | undefined, b: Color): Color {
  if (a === b) {
    return a;
  }
  if (a === undefined) {
    return b;
  }
  return Math.max(a, b);
}
