import { memo, ReactNode } from "react";
import { chainFrom } from "transducist";

import { Color } from "../_lib/gameLogic";

export interface ColoredKeyboardProps {
  colorsByLetter: Map<string, (Color | undefined)[]>;
}

export default memo(function ColoredKeyboard({
  colorsByLetter,
}: ColoredKeyboardProps): ReactNode {
  return (
    <div className="text-1xl select-none flex-col space-y-2 font-bold">
      <ColoredKeyboardRow letters="QWERTYUIOP" />
      <ColoredKeyboardRow letters="ASDFGHJKL" />
      <ColoredKeyboardRow letters="ZXCVBNM" />
    </div>
  );
});

interface ColoredKeyboardRowProps {
  letters: string;
}

const ColoredKeyboardRow = memo(function ColoredKeyboardRow({
  letters,
}: ColoredKeyboardRowProps): ReactNode {
  return (
    <div className="flex justify-center space-x-2">
      {chainFrom(letters)
        .map((letter) => (
          <ColoredKey key={letter} letter={letter} colors={[]} />
        ))
        .toArray()}
    </div>
  );
});

interface ColoredKeyProps {
  letter: string;
  colors: (Color | undefined)[];
}

const ColoredKey = memo(function ColoredKey({
  letter,
  colors,
}: ColoredKeyProps): ReactNode {
  return (
    <div className="flex h-14 w-11 cursor-pointer items-center justify-center rounded-lg bg-gray-400 text-white">
      {letter}
    </div>
  );
});
