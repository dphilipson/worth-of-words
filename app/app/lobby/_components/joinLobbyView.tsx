"use client";
import clsx from "clsx";
import { memo, ReactNode, useCallback, useState } from "react";
import { chainFrom, range, repeat } from "transducist";
import { useImmer } from "use-immer";

import TextInput from "@/app/_components/textInput";
import { WORD_LENGTH } from "@/app/_lib/constants";

export interface JoinLobbyViewProps {
  numSecrets: number;
  needsPassword: boolean;
  allowedWords: Set<string>;
  allKnownWords: Set<string>;
  onJoin(payload: JoinLobbyPayload): void;
}

export interface JoinLobbyPayload {
  playerName: string;
  password: string;
  words: string[];
}

export default memo(function JoinLobbyView({
  numSecrets,
  needsPassword,
  allowedWords,
  allKnownWords,
  onJoin,
}: JoinLobbyViewProps): ReactNode {
  const [playerName, setPlayerName] = useState("");
  const [password, setPassword] = useState("");
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
      !getError(word, allowedWords, allKnownWords),
  );

  const onConfirmClicked = useCallback(() => {
    if (playerName.length > 0 && wordsAreValid) {
      onJoin({ playerName, password, words });
    }
  }, [wordsAreValid, onJoin, playerName, password, words]);

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
          {needsPassword && (
            <>
              <label className="label">
                <span className="label-text">Lobby password</span>
              </label>
              <TextInput
                className="input input-bordered"
                type="password"
                placeholder="********"
                value={password}
                onValueChange={setPassword}
              />
            </>
          )}
          <h2 className="card-title mt-4">Secret words</h2>
          <p className="mb-4">
            Choose your secret words. Other players will try to guess these!
          </p>
          {chainFrom(range(numSecrets))
            .map((i) => (
              <SecretInput
                key={i}
                allowedWords={allowedWords}
                allKnownWords={allKnownWords}
                index={i}
                value={words[i]}
                onChange={onChange}
              />
            ))
            .toArray()}
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary"
            disabled={!wordsAreValid}
            onClick={onConfirmClicked}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
});

interface SecretInputProps {
  allowedWords: Set<string>;
  allKnownWords: Set<string>;
  index: number;
  value: string;
  onChange(value: string, index: number): void;
}

const SecretInput = memo(function SecretInput({
  allowedWords,
  allKnownWords,
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

  const error = getError(value, allowedWords, allKnownWords);
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
  allowedWords: Set<string>,
  allKnownWords: Set<string>,
): string | undefined {
  if (s.length !== WORD_LENGTH || allowedWords.has(s)) {
    return undefined;
  } else if (allKnownWords.has(s)) {
    return "Too hard. Word is a valid guess, but not a valid secret.";
  } else {
    return "Not a word.";
  }
}
