import { Address } from "viem";

import { WORTH_OF_WORDS_ADDRESS } from "./constants";
import { useStorage } from "./localStorage";

export interface SecretsAndSalt {
  words: string[];
  salt: bigint;
}

export interface GuessAndSalt {
  guess: string;
  salt: bigint;
}

export interface LobbyStorage {
  secrets: SecretsAndSalt | undefined;
  guess: GuessAndSalt | undefined;
  advancedToRound: number;
  setSecrets(secrets: SecretsAndSalt): void;
  setGuess(guess: GuessAndSalt): void;
  clearGuess(): void;
  setAdvancedToRound(round: number): void;
}

const SECRETS_KEY = "secrets";
const GUESS_KEY = "guess";
const ADVANCED_TO_ROUND_KEY = "advanced-to-round";

export function useLobbyStorage(
  lobbyId: bigint | undefined,
  walletAddress: Address | undefined,
): LobbyStorage | undefined {
  const getFullKey = (key: string) =>
    `worth-of-words:${WORTH_OF_WORDS_ADDRESS}:lobby:${lobbyId}:player:${walletAddress}:${key}`;
  const [secrets, setSecrets] = useStorage<SecretsAndSalt>({
    key: getFullKey(SECRETS_KEY),
    toJson: ({ words, salt }) => ({ words, salt: salt.toString() }),
    fromJson: ({ words, salt }) => ({ words, salt: BigInt(salt) }),
  });
  const [guess, setGuess] = useStorage<GuessAndSalt>({
    key: getFullKey(GUESS_KEY),
    toJson: ({ guess, salt }) => ({ guess, salt: salt.toString() }),
    fromJson: ({ guess, salt }) => ({ guess, salt: BigInt(salt) }),
  });
  const [advancedToRound, setAdvancedToRound] = useStorage<number>({
    key: getFullKey(ADVANCED_TO_ROUND_KEY),
  });
  if (lobbyId === undefined || walletAddress === undefined) {
    return undefined;
  }
  return {
    secrets,
    guess,
    advancedToRound: advancedToRound ?? 0,
    setSecrets,
    setGuess,
    clearGuess: () => setGuess(undefined),
    setAdvancedToRound,
  };
}
