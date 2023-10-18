import { memo, ReactNode } from "react";
import { chainFrom, range } from "transducist";

import { backgroundClassForColor, Color } from "../_lib/colors";
import { WORD_LENGTH } from "../_lib/constants";

export interface GuessGridProps {
  rows: GuessRowProps[];
  input: string | undefined;
}

export default memo(function GuessGrid({
  rows,
  input,
}: GuessGridProps): ReactNode {
  return (
    <div className="select-none flex-col space-y-1.5 text-3xl font-bold">
      {rows.map((row, i) => (
        <GuessRow key={i} {...row} />
      ))}
      {input !== undefined && <InputRow letters={input} />}
    </div>
  );
});

interface GuessRowProps {
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
}

const InputRow = memo(function InputRow({ letters }: InputRowProps): ReactNode {
  return (
    <div className="flex space-x-1.5">
      {chainFrom(range(WORD_LENGTH))
        .map((i) => <InputSquare key={i} letter={letters[i]} />)
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
}

const InputSquare = memo(function InputSquare({
  letter,
}: InputSquareProps): ReactNode {
  const borderColor =
    letter === undefined ? "border-gray-300" : "border-gray-500";
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center border-2 bg-base-100 text-black ${borderColor}`}
    >
      {letter}
    </div>
  );
});
