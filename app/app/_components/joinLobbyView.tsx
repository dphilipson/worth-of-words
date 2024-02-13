"use client";
import clsx from "clsx";
import { memo, ReactNode, useCallback, useMemo, useState } from "react";
import { IoDiceOutline } from "react-icons/io5";
import { chainFrom, range, repeat } from "transducist";
import { useImmer } from "use-immer";

import { WORD_LENGTH } from "../_lib/constants";
import { GameSpeed } from "../_lib/lobbyPresets";
import Card from "./card";
import LoadingButton from "./loadingButton";
import TextInput from "./textInput";

export interface JoinLobbyViewProps {
  numSecrets: number;
  validSecretWords: Set<string>;
  validGuessWords: Set<string>;
  speedPreset: GameSpeed | undefined;
  isJoining: boolean;
  onJoin(playerName: string, words: string[]): void;
}

export default memo(function JoinLobbyView({
  numSecrets,
  validSecretWords,
  validGuessWords,
  speedPreset,
  isJoining,
  onJoin,
}: JoinLobbyViewProps): ReactNode {
  const [playerName, setPlayerName] = useState("");
  const [words, updateWords] = useImmer(() =>
    chainFrom(repeat("", numSecrets)).toArray(),
  );
  const validSecretWordlist = useMemo(
    () => [...validSecretWords],
    [validSecretWords],
  );

  const onChange = useCallback(
    (word: string, index: number) => {
      updateWords((draft) => {
        draft[index] = word;
      });
    },
    [updateWords],
  );

  const inputsAreValid =
    playerName.length > 0 &&
    words.every(
      (word) =>
        word.length === WORD_LENGTH &&
        !getError(word, validSecretWords, validGuessWords),
    );

  const onConfirmClicked = useCallback(() => {
    if (inputsAreValid) {
      onJoin(playerName, words);
    }
  }, [inputsAreValid, onJoin, playerName, words]);

  return (
    <Card className="max-w-[36rem] lg:w-[36rem] lg:p-16">
      <h1 className="mb-0 text-center">Player ready?</h1>
      <h3 className="mb-2">What should we call you?</h3>
      <p className="mb-2 text-sm text-secondary">
        This name will be publically associated with your wallet address. Avoid
        identifying information.
      </p>
      <TextInput
        label="Player name"
        placeholder="Ana Steele"
        maxLength={50}
        value={playerName}
        onValueChange={setPlayerName}
      />
      <h3 className="mb-2">Choose your secret words</h3>
      <p className="mb-2 text-sm text-secondary">
        These are the words that other people will try to guess.
      </p>
      {chainFrom(range(numSecrets))
        .map((i) => (
          <SecretInput
            key={i}
            validSecretWords={validSecretWords}
            validGuessWords={validGuessWords}
            validSecretWordlist={validSecretWordlist}
            index={i}
            value={words[i]}
            onChange={onChange}
          />
        ))
        .toArray()}
      <LoadingButton
        className="btn btn-primary mt-10"
        isLoading={isJoining}
        disabled={!inputsAreValid}
        onClick={onConfirmClicked}
      >
        {isJoining ? "Entering lobby" : "Enter the lobby"}
      </LoadingButton>
    </Card>
  );
});

interface SecretInputProps {
  validSecretWords: Set<string>;
  validGuessWords: Set<string>;
  validSecretWordlist: string[];
  index: number;
  value: string;
  onChange(value: string, index: number): void;
}

const SecretInput = memo(function SecretInput({
  validSecretWords,
  validGuessWords,
  validSecretWordlist,
  index,
  value,
  onChange,
}: SecretInputProps): ReactNode {
  const onValueChange = useCallback(
    (newValue: string) => {
      if (isValidCharacters(newValue)) {
        onChange(newValue.toUpperCase(), index);
      }
    },
    [onChange, index],
  );

  const chooseRandomWord = useCallback(
    () => onValueChange(chooseRandom(validSecretWordlist)),
    [onValueChange, validSecretWordlist],
  );

  const error = getError(value, validSecretWords, validGuessWords);
  const isValid = !error && value.length === WORD_LENGTH;

  return (
    <div>
      <TextInput
        className={clsx(
          "font-medium",
          error && "border-error text-red-700",
          isValid && "border-success text-green-700",
        )}
        label={`Secret word ${index + 1}`}
        placeholder="Enter a word"
        button={
          <button
            className="btn h-12 w-12 border-2 border-[#E2E8F0] px-1"
            onClick={chooseRandomWord}
          >
            <IoDiceOutline className="text-3xl" />
          </button>
        }
        value={value}
        onValueChange={onValueChange}
      />
      <label className="label -mb-2 pb-0 pl-0 pt-1">
        <span
          className={clsx("label-text-alt text-error", !error && "invisible")}
        >
          {error ?? "A"}
        </span>
      </label>
    </div>
  );
});

function isValidCharacters(s: string): boolean {
  return s.length <= WORD_LENGTH && !!s.match(/^[a-zA-Z]*$/);
}

function getError(
  s: string,
  validSecretWords: Set<string>,
  validGuessWords: Set<string>,
): string | undefined {
  if (s.length !== WORD_LENGTH || validSecretWords.has(s)) {
    return undefined;
  } else if (validGuessWords.has(s)) {
    return "Word is a valid guess, but not a valid secret.";
  } else {
    return "Not a word.";
  }
}

// Assumes `xs` is not empty.
function chooseRandom<T>(xs: T[]): T {
  const index = (Math.random() * xs.length) | 0;
  return xs[index];
}
