import clsx from "clsx";
import { memo, ReactNode } from "react";
import { chainFrom, range } from "transducist";

import { backgroundClassForColor } from "../_lib/colors";
import { WORD_LENGTH } from "../_lib/constants";
import { Color } from "../_lib/gameLogic";

export interface GuessGridProps {
  secretWord: string | undefined;
  scoredRows: ScoredRowProps[];
  inputRows: InputRowProps[];
}

export interface ScoredRowProps {
  word: string;
  colors: Color[];
  isFromCurrentPlayer: boolean;
  isSelfGrid: boolean;
}

export interface InputRowProps {
  letters: string;
  inputIsInvalid: boolean;
  isFromCurrentPlayer: boolean;
}

export default memo(function GuessGrid({
  secretWord,
  scoredRows,
  inputRows,
}: GuessGridProps): ReactNode {
  return (
    <div className="select-none flex-col space-y-1.5 text-3xl font-bold">
      {secretWord && (
        <InputRow
          letters={secretWord}
          inputIsInvalid={false}
          isFromCurrentPlayer={false}
        />
      )}
      {scoredRows.map((row, i) => (
        <GuessRow key={i} {...row} />
      ))}
      {inputRows.map((row, i) => (
        <InputRow key={i} {...row} />
      ))}
    </div>
  );
});

const GuessRow = memo(function GuessRow({
  word,
  colors,
  isFromCurrentPlayer,
  isSelfGrid,
}: ScoredRowProps): ReactNode {
  return (
    <div
      className={clsx(
        "flex space-x-1.5",
        isFromCurrentPlayer && "-ml-2 border-l-4 border-l-primary pl-1",
      )}
    >
      {colors.map((color, i) => (
        <GuessSquare
          key={i}
          letter={word[i]}
          color={color}
          isSelfGrid={isSelfGrid}
        />
      ))}
    </div>
  );
});

const InputRow = memo(function InputRow({
  letters,
  inputIsInvalid,
  isFromCurrentPlayer,
}: InputRowProps): ReactNode {
  return (
    <div
      className={clsx(
        "flex space-x-1.5",
        isFromCurrentPlayer && "-ml-2 border-l-4 border-l-primary pl-1",
      )}
    >
      {chainFrom(range(WORD_LENGTH))
        .map((i) => (
          <InputSquare key={i} letter={letters[i]} isInvalid={inputIsInvalid} />
        ))
        .toArray()}
    </div>
  );
});

interface GuessSquareProps {
  letter: string;
  color: Color;
  isSelfGrid: boolean;
}

const GuessSquare = memo(function GuessSquare({
  letter,
  color,
  isSelfGrid,
}: GuessSquareProps): ReactNode {
  const bgColor =
    color === Color.GREEN && isSelfGrid
      ? "bg-red-600"
      : backgroundClassForColor(color);
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center text-base-100 ${bgColor} shadow-sm`}
    >
      {letter}
    </div>
  );
});

interface InputSquareProps {
  letter: string | undefined;
  isInvalid: boolean;
}

const InputSquare = memo(function InputSquare({
  letter,
  isInvalid,
}: InputSquareProps): ReactNode {
  const borderColor = (() => {
    if (isInvalid) {
      return "border-error";
    } else if (letter === undefined) {
      return "border-gray-300";
    } else {
      return "border-gray-500";
    }
  })();
  const textColor = isInvalid ? "text-red-700" : "text-red";
  return (
    <div
      className={clsx(
        "flex h-12 w-12 items-center justify-center border-2 bg-base-100 shadow-lg",
        borderColor,
        textColor,
      )}
    >
      {letter}
    </div>
  );
});
