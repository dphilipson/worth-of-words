"use client";
import clsx from "clsx";
import { memo, ReactNode, useCallback, useState } from "react";
import { chainFrom, range, repeat } from "transducist";
import { useImmer } from "use-immer";

import { WORD_LENGTH } from "../_lib/constants";
import LoadingButton from "./loadingButton";
import TextInput from "./textInput";

export interface JoinLobbyViewProps {
  numSecrets: number;
  validSecretWords: Set<string>;
  validGuessWords: Set<string>;
  isJoining: boolean;
  onJoin(playerName: string, words: string[]): void;
}

export default memo(function JoinLobbyView({
  numSecrets,
  validSecretWords,
  validGuessWords,
  isJoining,
  onJoin,
}: JoinLobbyViewProps): ReactNode {
  const [playerName, setPlayerName] = useState("");
  const [words, updateWords] = useImmer(() =>
    chainFrom(repeat("", numSecrets)).toArray(),
  );

  const onChange = useCallback(
    (word: string, index: number) => {
      updateWords((draft) => {
        draft[index] = word;
      });
    },
    [updateWords],
  );

  const wordsAreValid = words.every(
    (word) =>
      word.length === WORD_LENGTH &&
      !getError(word, validSecretWords, validGuessWords),
  );

  const onConfirmClicked = useCallback(() => {
    if (playerName.length > 0 && wordsAreValid) {
      onJoin(playerName, words);
    }
  }, [wordsAreValid, onJoin, playerName, words]);

  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Join Lobby</h2>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">Player name</span>
          </label>
          <TextInput
            className="input input-bordered"
            placeholder="Ana Steele"
            value={playerName}
            onValueChange={setPlayerName}
          />
          <h2 className="card-title mt-4">Secret words</h2>
          <p className="mb-4">
            Choose your secret words. Other players will try to guess these!
          </p>
          {chainFrom(range(numSecrets))
            .map((i) => (
              <SecretInput
                key={i}
                validSecretWords={validSecretWords}
                validGuessWords={validGuessWords}
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
            disabled={!wordsAreValid}
            onClick={onConfirmClicked}
          >
            {isJoining ? "Joining lobby" : "Join lobby"}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
});

interface SecretInputProps {
  validSecretWords: Set<string>;
  validGuessWords: Set<string>;
  index: number;
  value: string;
  onChange(value: string, index: number): void;
}

const SecretInput = memo(function SecretInput({
  validSecretWords,
  validGuessWords,
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

  const error = getError(value, validSecretWords, validGuessWords);
  const isValid = !error && value.length === WORD_LENGTH;

  return (
    <>
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
    return "Too hard. Word is a valid guess, but not a valid secret.";
  } else {
    return "Not a word.";
  }
}
