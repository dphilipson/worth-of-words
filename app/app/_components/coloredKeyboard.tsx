import clsx from "clsx";
import { memo, ReactNode, useCallback, useMemo } from "react";
import { chainFrom } from "transducist";

import { backgroundClassForColor } from "../_lib/colors";
import { Color } from "../_lib/gameLogic";

export interface ColoredKeyboardProps {
  colorsByLetter: Map<string, Color>[];
  selectedIndex: number | undefined;
  onKey(keyCode: string): void;
}

export default memo(function ColoredKeyboard({
  colorsByLetter,
  selectedIndex,
  onKey,
}: ColoredKeyboardProps): ReactNode {
  return (
    <div className="text-1xl select-none flex-col space-y-2 font-bold">
      <ColoredKeyboardRow
        colorsByLetter={colorsByLetter}
        selectedIndex={selectedIndex}
        letters="QWERTYUIOP"
        hasMetaButtons={false}
        onKey={onKey}
      />
      <ColoredKeyboardRow
        colorsByLetter={colorsByLetter}
        selectedIndex={selectedIndex}
        letters="ASDFGHJKL"
        hasMetaButtons={false}
        onKey={onKey}
      />
      <ColoredKeyboardRow
        colorsByLetter={colorsByLetter}
        selectedIndex={selectedIndex}
        letters="ZXCVBNM"
        hasMetaButtons={true}
        onKey={onKey}
      />
    </div>
  );
});

interface ColoredKeyboardRowProps {
  colorsByLetter: Map<string, Color>[];
  selectedIndex: number | undefined;
  letters: string;
  hasMetaButtons: boolean;
  onKey(keyCode: string): void;
}

const ColoredKeyboardRow = memo(function ColoredKeyboardRow({
  colorsByLetter,
  selectedIndex,
  letters,
  hasMetaButtons,
  onKey,
}: ColoredKeyboardRowProps): ReactNode {
  return (
    <div className="flex justify-center space-x-2">
      {hasMetaButtons && <MetaKey text="ENTER" keyCode="Enter" onKey={onKey} />}
      {chainFrom(letters)
        .map((letter) => (
          <ColoredKey
            key={letter}
            colorsByLetter={colorsByLetter}
            selectedIndex={selectedIndex}
            letter={letter}
            onKey={onKey}
          />
        ))
        .toArray()}
      {hasMetaButtons && (
        <MetaKey text="DELETE" keyCode="Backspace" onKey={onKey} />
      )}
    </div>
  );
});

interface ColoredKeyProps {
  colorsByLetter: Map<string, Color>[];
  selectedIndex: number | undefined;
  letter: string;
  onKey(keyCode: string): void;
}

const ColoredKey = memo(function ColoredKey({
  colorsByLetter,
  selectedIndex,
  letter,
  onKey,
}: ColoredKeyProps): ReactNode {
  const colors = useMemo(
    () => colorsByLetter.map((m) => m.get(letter)),
    [colorsByLetter, letter],
  );
  const onClick = useCallback(() => onKey(letter), [onKey, letter]);
  const fullColor = (() => {
    if (selectedIndex !== undefined) {
      return colors[selectedIndex];
    } else if (
      colors.length > 0 &&
      colors.every((color) => color === colors[0])
    ) {
      return colors[0];
    } else {
      return undefined;
    }
  })();

  if (fullColor !== undefined) {
    return (
      <div
        className={clsx(
          "flex h-14 w-11 cursor-pointer items-center justify-center rounded-lg text-white shadow-xl",
          backgroundClassForColor(fullColor),
        )}
        onClick={onClick}
      >
        {letter}
      </div>
    );
  } else {
    return (
      <div
        className="relative flex h-14 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-300 text-black shadow-xl"
        onClick={onClick}
      >
        <div className="absolute top-0 flex w-full space-x-0.5">
          {colors.map((color, i) => (
            <div
              key={i}
              className={clsx(
                "h-4 flex-1 rounded-sm",
                backgroundClassForColor(color),
              )}
            />
          ))}
        </div>
        {letter}
      </div>
    );
  }
});

interface MetaKeyProps {
  text: string;
  keyCode: string;
  onKey(keyCode: string): void;
}

const MetaKey = memo(function MetaKey({
  text,
  keyCode,
  onKey,
}: MetaKeyProps): ReactNode {
  const onClick = useCallback(() => onKey(keyCode), [onKey, keyCode]);
  return (
    <div
      className="flex h-14 w-24 cursor-pointer items-center justify-center rounded-lg bg-gray-300 text-black shadow-xl"
      onClick={onClick}
    >
      {text}
    </div>
  );
});
