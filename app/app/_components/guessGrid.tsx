import clsx from "clsx";
import { memo, ReactNode } from "react";
import { chainFrom, range } from "transducist";

import { backgroundClassForColor, Color } from "../_lib/colors";
import { WORD_LENGTH } from "../_lib/constants";

export interface GuessGridProps {
  rows: GuessRowProps[];
  input: string | undefined;
  isInvalidWord: boolean;
}

export default memo(function GuessGrid({
  rows,
  input,
  isInvalidWord,
}: GuessGridProps): ReactNode {
  return (
    <div className="select-none flex-col space-y-1.5 text-3xl font-bold">
      {rows.map((row, i) => (
        <GuessRow key={i} {...row} />
      ))}
      {input !== undefined && (
        <InputRow letters={input} isInvalidWord={isInvalidWord} />
      )}
    </div>
  );
});

export interface GuessRowProps {
  word: string;
  colors: Color[];
}

const GuessRow = memo(function GuessRow({
  word,
  colors,
}: GuessRowProps): ReactNode {
  return (
    <div className="flex space-x-1.5">
      {colors.map((color, i) => (
        <GuessSquare key={i} letter={word[i]} color={color} />
      ))}
    </div>
  );
});

interface InputRowProps {
  letters: string;
  isInvalidWord: boolean;
}

const InputRow = memo(function InputRow({
  letters,
  isInvalidWord,
}: InputRowProps): ReactNode {
  return (
    <div className="flex space-x-1.5">
      {chainFrom(range(WORD_LENGTH))
        .map((i) => (
          <InputSquare key={i} letter={letters[i]} isInvalid={isInvalidWord} />
        ))
        .toArray()}
    </div>
  );
});

interface GuessSquareProps {
  letter: string;
  color: Color;
}

const GuessSquare = memo(function GuessSquare({
  letter,
  color,
}: GuessSquareProps): ReactNode {
  const bgColor = backgroundClassForColor(color);
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center text-base-100 ${bgColor}`}
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
        "flex h-12 w-12 items-center justify-center border-2 bg-base-100",
        borderColor,
        textColor,
      )}
    >
      {letter}
    </div>
  );
});
