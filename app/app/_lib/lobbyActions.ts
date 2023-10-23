import { encodeFunctionData, encodePacked, Hex, keccak256 } from "viem";

import { iWorthOfWordsABI } from "../_generated/wagmi";
import { getAttackers, LobbyState } from "./gameLogic";
import { LobbyStorage, SecretAndSalt } from "./lobbyStorage";
import { getGuessWordMerkleTree, getSecretWordMerkleTree } from "./merkle";
import { getLobbyPassword } from "./password";
import {
  getScoreGuessProver,
  getValidWordProver,
  ProofCallData,
} from "./proofs";
import { randomUint256 } from "./random";
import { WalletLike } from "./useWallet";
import { wordToLetters, wordToNumber } from "./words";

export interface LobbyActions {
  joinLobby(
    playerName: string,
    secretWords: string[],
    lobbyPrivateKey: Hex | undefined,
  ): Promise<void>;
  startGame(): Promise<void>;
  commitGuess(guess: string): Promise<void>;
  revealGuess(): Promise<void>;
  revealMatches(): Promise<void>;
  endRevealMatchesPhase(): Promise<void>;
}

export class LobbyActionsImpl implements LobbyActions {
  constructor(
    private readonly lobbyId: bigint,
    private readonly wallet: WalletLike,
    private readonly storage: LobbyStorage,
    private state: LobbyState,
  ) {}

  public setLobbyState(state: LobbyState): void {
    this.state = state;
  }

  public async joinLobby(
    playerName: string,
    secretWords: string[],
    lobbyPrivateKey: Hex | undefined,
  ): Promise<void> {
    const [prover, tree, password] = await Promise.all([
      getValidWordProver(),
      getSecretWordMerkleTree(),
      lobbyPrivateKey !== undefined
        ? getLobbyPassword(lobbyPrivateKey, this.wallet.address)
        : ("0x" as Hex),
    ]);
    const secrets: SecretAndSalt[] = secretWords.map((word) => ({
      word,
      salt: randomUint256(),
    }));
    const proofs: ProofCallData[] = [];
    for (const { word, salt } of secrets) {
      const merkleProof = tree.getProof(word);
      if (merkleProof === undefined) {
        throw new Error("Could not generate proof. Invalid word: " + word);
      }
      const proof = await prover({
        word: wordToNumber(word),
        salt: salt.toString(),
        ...merkleProof,
      });
      proofs.push(proof);
    }
    this.storage.storeSecretWordsAndSalts(secrets);
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "joinLobby",
        args: [this.lobbyId, playerName, password, proofs],
      }),
    );
  }

  public startGame(): Promise<void> {
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "startGame",
        args: [this.lobbyId],
      }),
    );
  }

  public commitGuess(guess: string): Promise<void> {
    const salt = randomUint256();
    const commitment = keccak256(
      encodePacked(["uint24", "uint256"], [wordToNumber(guess), salt]),
    );
    this.storage.storeGuess({ word: guess, salt });
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "commitGuess",
        args: [this.lobbyId, commitment],
      }),
    );
  }

  public async revealGuess(): Promise<void> {
    const guessAndSalt = this.storage.loadGuess();
    if (guessAndSalt === undefined) {
      throw new Error("Couldn't find guess in storage to reveal.");
    }
    const { word, salt } = guessAndSalt;
    const tree = await getGuessWordMerkleTree();
    const wordAsNumber = wordToNumber(word);
    const merkleProof = tree.getProof([wordAsNumber]) as Hex[];
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "revealGuess",
        args: [this.lobbyId, wordAsNumber, salt, merkleProof],
      }),
    );
  }

  public async revealMatches(): Promise<void> {
    const attackers = getAttackers(this.state, this.wallet.address);
    const currentWordIndex =
      this.state.config.numLives -
      this.state.playersByAddress.get(this.wallet.address)!.livesLeft;
    // Do NOT compute proofs concurrently. The prover will give bad results.
    const proofs: ProofCallData[] = [];
    for (const attacker of attackers) {
      // const proofs = await Promise.all(
      //   attackers.map(async (attacker) => {
      if (attacker.revealedGuess === undefined) {
        const o = BigInt(0);
        proofs.push({
          _pA: [o, o],
          _pB: [
            [o, o],
            [o, o],
          ],
          _pC: [o, o],
          _pubSignals: [o, o, o, o, o, o, o, o, o, o, o],
        });
        continue;
      }
      const prover = await getScoreGuessProver();
      const secretWordsAndSalts = this.storage.loadSecretWordsAndSalts();
      if (!secretWordsAndSalts) {
        throw new Error("Secret words not in storage! Cannot reveal.");
      }
      const { word, salt } = secretWordsAndSalts[currentWordIndex];

      const proof = await prover({
        word: wordToLetters(word),
        salt: salt.toString(),
        guess: wordToLetters(attacker.revealedGuess),
      });
      proofs.push(proof);
    }
    this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "revealMatches",
        args: [this.lobbyId, proofs],
      }),
    );
  }

  public endRevealMatchesPhase(): Promise<void> {
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "endRevealMatchesPhase",
        args: [this.lobbyId],
      }),
    );
  }
}
