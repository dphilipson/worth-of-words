import { getGuessWordMerkleTree, getSecretWordMerkleTree } from "./merkle";
import {
  getScoreGuessesProver,
  getValidWordsProver,
  ProofCallData,
} from "./proofs";
import { wordToLetters, wordToNumber } from "./words";

/**
 * This is unbelievably lazy, but I need proofs that I can use in the contract
 * unit tests. Since I already have frontend code that generates these proofs,
 * I'll make a function that can run in the frontend and print to the browser
 * console, then copy/paste from there.
 */
export async function printTestData(): Promise<void> {
  await printValidMammaProof();
  await printImamsMerkleProof();
  await printImamsOnMammaScoreProof();
}

export async function printValidMammaProof(): Promise<void> {
  await printValidWordsProof(["MAMMA", "GOODY", "ESSAY"]);
}

export async function printImamsMerkleProof(): Promise<void> {
  const tree = await getGuessWordMerkleTree();
  const proof = tree.getProof([wordToNumber("IMAMS")]);
  console.log(`[${proof.join(",")}]`);
}

export async function printImamsOnMammaScoreProof(): Promise<void> {
  const prover = await getScoreGuessesProver();
  const proof = await prover({
    word: wordToLetters("MAMMA"),
    salt: "1",
    guesses: [
      wordToLetters("IMAMS"),
      wordToLetters("MOOCH"),
      wordToLetters("PALEO"),
    ],
  });
  printProof(proof);
}

async function printValidWordsProof(words: string[]): Promise<void> {
  const startTime = Date.now();
  const wordsAsNumbers: number[] = [];
  const proofHashes: string[][] = [];
  const proofOrderings: number[][] = [];
  const tree = await getSecretWordMerkleTree();
  for (const word of words) {
    const { proofHashes: hashes, proofOrderings: orderings } =
      tree.getProof(word)!;
    wordsAsNumbers.push(wordToNumber(word));
    proofHashes.push(hashes);
    proofOrderings.push(orderings);
  }
  const prover = await getValidWordsProver();
  const proof = await prover({
    words: wordsAsNumbers,
    salt: "1",
    proofHashes,
    proofOrderings,
    merkleRoot: tree.root.toString(),
  });
  printProof(proof);
  const duration = Date.now() - startTime;
  console.log(`Proof generated in ${duration}ms`);
}

function printProof(proof: ProofCallData): void {
  console.log(
    JSON.stringify(
      proof,
      (_, value) => (typeof value === "bigint" ? value.toString() : value),
      4,
    ).replaceAll('"', ""),
  );
}
