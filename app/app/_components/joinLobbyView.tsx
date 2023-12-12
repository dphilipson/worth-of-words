"use client";
import clsx from "clsx";
import { memo, ReactNode, useCallback, useMemo, useState } from "react";
import { chainFrom, range, repeat } from "transducist";
import { useImmer } from "use-immer";

import { WORD_LENGTH } from "../_lib/constants";
import { GameSpeed } from "../_lib/lobbyPresets";
import CopyLobbyUrlButton from "./copyLobbyUrlButton";
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
    <div className="flex w-full flex-col items-center space-y-10">
      <CopyLobbyUrlButton />
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Join Lobby</h2>
          <p>Game speed: {speedPreset?.toLowerCase()}</p>
          <div className="form-control max-w-xs">
            <h2 className="card-title mt-4">Player Name</h2>
            <p className="mb-2 text-sm">
              This name will be publicly associated with your wallet address.
              Avoid identifying information.
            </p>
            <TextInput
              className="input input-bordered"
              placeholder="Ana Steele"
              value={playerName}
              onValueChange={setPlayerName}
            />
            <h2 className="card-title mt-4">Secret words</h2>
            <p className="mb-4 text-sm">
              Choose your secret words. Other players will try to guess these!
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
          </div>
          <div className="card-actions justify-end">
            <LoadingButton
              className="btn btn-primary"
              isLoading={isJoining}
              disabled={!inputsAreValid}
              onClick={onConfirmClicked}
            >
              {isJoining ? "Joining lobby" : "Join lobby"}
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
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

  const useRandom = useCallback(
    () => onValueChange(chooseRandom(validSecretWordlist)),
    [onValueChange, validSecretWordlist],
  );

  const error = getError(value, validSecretWords, validGuessWords);
  const isValid = !error && value.length === WORD_LENGTH;

  return (
    <>
      <div className="flex items-center space-x-2">
        <TextInput
          placeholder={`Secret word ${index + 1}`}
          className={clsx(
            "input input-bordered font-medium",
            error && "border-error text-red-700",
            isValid && "border-success text-green-700",
          )}
          value={value}
          onValueChange={onValueChange}
        />
        <button
          className="btn btn-ghost btn-sm text-gray-500"
          onClick={useRandom}
        >
          Random
        </button>
      </div>
      <label className="label">
        <span
          className={clsx("label-text-alt text-error", !error && "invisible")}
        >
          {error ?? "A"}
        </span>
      </label>
    </>
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
