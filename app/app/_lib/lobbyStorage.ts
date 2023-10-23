import { Address } from "viem";

export interface SecretAndSalt {
  word: string;
  salt: bigint;
}

const SECRETS_AND_SALTS_KEY = "secrets-and-salts";
const GUESS_KEY = "guess";

export class LobbyStorage {
  constructor(
    private readonly lobbyId: bigint,
    private readonly walletAddress: Address,
  ) {}

  public storeSecretWordsAndSalts(secrets: SecretAndSalt[]): void {
    const stringySecrets = secrets.map(stringifySecret);
    this.store(SECRETS_AND_SALTS_KEY, JSON.stringify(stringySecrets));
  }

  public loadSecretWordsAndSalts(): SecretAndSalt[] {
    // TODO: Error handling if not present, and below.
    const stringySecretsAndSalts = JSON.parse(
      this.load(SECRETS_AND_SALTS_KEY)!,
    );
    return stringySecretsAndSalts.map(unstringifySecret);
  }

  public storeGuess(guess: SecretAndSalt): void {
    const stringyGuess = stringifySecret(guess);
    this.store(GUESS_KEY, JSON.stringify(stringyGuess));
  }

  public loadGuess(): SecretAndSalt {
    const stringyGuess = JSON.parse(this.load(GUESS_KEY)!);
    return unstringifySecret(stringyGuess);
  }

  private store(key: string, value: string): void {
    localStorage.setItem(this.fullKey(key), value);
  }

  private load(key: string): string | undefined {
    return localStorage.getItem(this.fullKey(key)) ?? undefined;
  }

  private fullKey(key: string): string {
    return `worth-of-words:lobby:${this.lobbyId}:player:${this.walletAddress}:${key}`;
  }
}

function stringifySecret({ word, salt }: SecretAndSalt): unknown {
  return { word, salt: salt.toString() };
}

function unstringifySecret({ word, salt }: any): SecretAndSalt {
  return { word, salt: BigInt(salt) };
}
