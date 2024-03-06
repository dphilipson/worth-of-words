import clsx from "clsx";
import { memo, ReactNode, useCallback, useMemo } from "react";
import { FaDeleteLeft } from "react-icons/fa6";
import { chainFrom } from "transducist";

import { backgroundClassForColor } from "../_lib/colors";
import { Color } from "../_lib/gameLogic";

export interface ColoredKeyboardProps {
  colorsByLetter: Map<string, Color>[];
  selectedIndex: number | undefined;
  disabled: boolean;
  onKey(keyCode: string): void;
}

export default memo(function ColoredKeyboard({
  colorsByLetter,
  selectedIndex,
  disabled,
  onKey,
}: ColoredKeyboardProps): ReactNode {
  return (
    <div
      className={clsx(
        "text-1xl w-screen max-w-[500px] touch-manipulation select-none flex-col space-y-2 px-2 font-bold",
        disabled && "pointer-events-none opacity-30",
      )}
    >
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
  const hasSpacers = !hasMetaButtons && letters.length < 10;
  const spacer = hasSpacers && <div className="flex-[0.5_0.5_0%]" />;
  return (
    <div className="flex space-x-1 sm:space-x-2">
      {hasMetaButtons && (
        <MetaKey keyCode="Enter" onKey={onKey}>
          <span className="text-xs">ENTER</span>
        </MetaKey>
      )}
      {spacer}
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
      {spacer}
      {hasMetaButtons && (
        <MetaKey keyCode="Backspace" onKey={onKey}>
          <FaDeleteLeft />
        </MetaKey>
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
      return colors[selectedIndex < colors.length ? selectedIndex : 0];
    } else if (
      colors.length > 0 &&
      colors.every((color) => color === colors[0])
    ) {
      return colors[0];
    } else {
      return undefined;
    }
  })();

  return (
    <div
      className={clsx(
        "relative flex h-14 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg shadow-xl transition-transform hover:scale-105 active:scale-95",
        fullColor !== undefined
          ? backgroundClassForColor(fullColor) + " text-white"
          : "bg-gray-300 text-black",
      )}
      onClick={onClick}
    >
      {fullColor === undefined && selectedIndex === undefined && (
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
      )}
      {letter}
    </div>
  );
});

interface MetaKeyProps {
  children: ReactNode;
  keyCode: string;
  onKey(keyCode: string): void;
}

const MetaKey = memo(function MetaKey({
  children,
  keyCode,
  onKey,
}: MetaKeyProps): ReactNode {
  const onClick = useCallback(() => onKey(keyCode), [onKey, keyCode]);
  return (
    <div
      className="flex h-14 w-24 flex-[1.5_1.5_0%] cursor-pointer items-center justify-center rounded-lg bg-gray-300 text-black shadow-xl hover:scale-105 active:scale-95"
      onClick={onClick}
    >
      {children}
    </div>
  );
});
