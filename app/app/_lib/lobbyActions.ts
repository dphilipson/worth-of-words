import { encodeFunctionData, encodePacked, Hex, keccak256 } from "viem";

import { iWorthOfWordsABI } from "../_generated/wagmi";
import {
  GUESSES_IN_PROOF,
  SECRET_WORDS_IN_PROOF,
  WORD_LENGTH,
} from "./constants";
import { getAttackers, LobbyState } from "./gameLogic";
import { LobbyStorage } from "./lobbyStorage";
import { getGuessWordMerkleTree, getSecretWordMerkleTree } from "./merkle";
import { getLobbyPassword } from "./password";
import { getScoreGuessesProver, getValidWordsProver } from "./proofs";
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

// The proof always needs GUESSES_IN_PROOF guesses, even if the number of
// attackers that revealed guesses is less, so we must fill any missing guesses
// with dummy guesses. The results of the dummy guesses are ignored, but they
// can still reveal information. We'll use a dummy guess composed of "letters"
// outside the range [0, 26) so it cannot possibly match with any word.
const DUMMY_GUESS: number[] = new Array(WORD_LENGTH).fill(-1);

export class LobbyActionsImpl implements LobbyActions {
  constructor(
    private readonly lobbyId: bigint,
    private readonly wallet: WalletLike,
    private storage: LobbyStorage,
    private state: LobbyState,
  ) {}

  public setLobbyStorage(storage: LobbyStorage): void {
    this.storage = storage;
  }

  public setLobbyState(state: LobbyState): void {
    this.state = state;
  }

  public async joinLobby(
    playerName: string,
    words: string[],
    lobbyPrivateKey: Hex | undefined,
  ): Promise<void> {
    const [prover, tree, password] = await Promise.all([
      getValidWordsProver(),
      getSecretWordMerkleTree(),
      lobbyPrivateKey !== undefined
        ? getLobbyPassword(lobbyPrivateKey, this.wallet.address)
        : ("0x" as Hex),
    ]);
    const salt = randomUint256();
    const proofHashes: string[][] = [];
    const proofOrderings: number[][] = [];
    for (const word of words) {
      const merkleProof = tree.getProof(word);
      if (merkleProof === undefined) {
        throw new Error("Could not generate proof. Invalid word: " + word);
      }
      proofHashes.push(merkleProof.proofHashes);
      proofOrderings.push(merkleProof.proofOrderings);
    }
    const wordsForProof = words.map(wordToNumber);
    // Pad the words up to the proof size if numLives is smaller. The additional
    // words must be valid words for the proof to be valid but will otherwise be
    // ignored, so repeat the first word until the desired length.
    while (wordsForProof.length < SECRET_WORDS_IN_PROOF) {
      wordsForProof.push(wordsForProof[0]);
      proofHashes.push(proofHashes[0]);
      proofOrderings.push(proofOrderings[0]);
    }
    const proof = await prover({
      words: wordsForProof,
      salt: salt.toString(),
      proofHashes,
      proofOrderings,
      merkleRoot: tree.root.toString(),
    });
    this.storage.setSecrets({ words, salt });
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "joinLobby",
        args: [this.lobbyId, playerName, password, proof],
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
    this.storage.setGuess({ guess, salt });
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "commitGuess",
        args: [this.lobbyId, commitment],
      }),
    );
  }

  public async revealGuess(): Promise<void> {
    const guessAndSalt = this.storage.guess;
    if (guessAndSalt === undefined) {
      throw new Error("Couldn't find guess in storage to reveal.");
    }
    const { guess, salt } = guessAndSalt;
    const tree = await getGuessWordMerkleTree();
    const guessAsNumber = wordToNumber(guess);
    const merkleProof = tree.getProof([guessAsNumber]) as Hex[];
    return this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "revealGuess",
        args: [this.lobbyId, guessAsNumber, salt, merkleProof],
      }),
    );
  }

  public async revealMatches(): Promise<void> {
    const attackers = getAttackers(this.state, this.wallet.address);
    const currentWordIndex =
      this.state.config.numLives -
      this.state.playersByAddress.get(this.wallet.address)!.livesLeft;

    const prover = await getScoreGuessesProver();
    const secrets = this.storage.secrets;
    if (!secrets) {
      throw new Error("Secret words not in storage! Cannot reveal.");
    }
    const { words, salt } = secrets;
    const guesses = attackers.map((attacker) =>
      attacker.revealedGuess === undefined
        ? DUMMY_GUESS
        : wordToLetters(attacker.revealedGuess),
    );
    while (guesses.length < GUESSES_IN_PROOF) {
      guesses.push(DUMMY_GUESS);
    }
    const proof = await prover({
      word: wordToLetters(words[currentWordIndex]),
      salt: salt.toString(),
      guesses,
    });
    this.wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsABI,
        functionName: "revealMatches",
        args: [this.lobbyId, proof],
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
