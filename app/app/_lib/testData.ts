import { getGuessWordMerkleTree, getSecretWordMerkleTree } from "./merkle";
import {
  getScoreGuessProver,
  getValidWordProver,
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

async function printValidMammaProof(): Promise<void> {
  const word = "MAMMA";
  const tree = await getSecretWordMerkleTree();
  const { proofHashes, proofOrderings } = tree.getProof(word)!;
  const prover = await getValidWordProver();
  const proof = await prover({
    word: wordToNumber(word),
    salt: "1",
    proofHashes,
    proofOrderings,
  });
  printProof(proof);
}

async function printImamsMerkleProof(): Promise<void> {
  const tree = await getGuessWordMerkleTree();
  const proof = tree.getProof([wordToNumber("IMAMS")]);
  console.log(`[${proof.join(",")}]`);
}

async function printImamsOnMammaScoreProof(): Promise<void> {
  const prover = await getScoreGuessProver();
  const proof = await prover({
    word: wordToLetters("MAMMA"),
    salt: "1",
    guess: wordToLetters("IMAMS"),
  });
  printProof(proof);
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
