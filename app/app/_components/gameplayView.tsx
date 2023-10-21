import clsx from "clsx";
import { memo, ReactNode, useCallback, useState } from "react";

import { Color, getPlayer, Phase } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";
import ColoredKeyboard from "./coloredKeyboard";
import ConnectedColoredKeyboard from "./connectedColoredKeyboard";
import { Countdown } from "./countdown";
import KeyboardCapture from "./keyboardCapture";
import TargetsView from "./targetsView";

export default memo(function GameplayView(): ReactNode {
  const { playerAddress, lobby, validGuessWords, actions } = useLobby();
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commitGuess = useCallback(
    (guess: string) => {
      setIsSubmitting(true);
      actions.commitGuess(guess);
    },
    [actions],
  );

  const { input, onKey, clearInput } = useInputKeys(
    validGuessWords,
    commitGuess,
  );

  const isInputtingGuess =
    lobby.currentPhase === Phase.COMMITING_GUESSES &&
    !isSubmitting &&
    !getPlayer(lobby, playerAddress).hasCommittedGuess;

  return (
    <>
      {isInputtingGuess && <KeyboardCapture onKey={onKey} />}
      <div className="min-h-[400px]">
        <TargetsView currentInput={input} />
      </div>
      <div className="flex flex-col items-center">
        <Countdown className="text-5xl" deadline={lobby.phaseDeadline} />
        <p className="mt-2 text-gray-700">…left to submit guesses</p>
      </div>
      <div className={clsx("mt-10", !isInputtingGuess && "opacity-30")}>
        <ConnectedColoredKeyboard
          selectedIndex={selectedTargetIndex}
          onKey={onKey}
        />
      </div>
    </>
  );
});

interface InputKeysContext {
  input: string;
  onKey(keyCode: string): void;
  clearInput(): void;
}

function useInputKeys(
  validGuessWords: Set<string>,
  onSubmit: (word: string) => void,
): InputKeysContext {
  const [input, setInput] = useState("");
  const onKey = useCallback(
    (keyCode: string) => {
      if (input.length > 0 && keyCode === "Backspace") {
        setInput(input.slice(0, -1));
      } else if (
        input.length === 5 &&
        keyCode === "Enter" &&
        validGuessWords.has(input)
      ) {
        onSubmit(input);
      } else if (input.length < 5 && isLetter(keyCode)) {
        setInput(input + keyCode.toUpperCase());
      }
    },
    [input, onSubmit, validGuessWords],
  );
  const clearInput = useCallback(() => setInput(""), [setInput]);
  return { input, onKey, clearInput };
}

function isLetter(s: string) {
  return s.match(/^[a-zA-Z]$/);
}
