import { mimcSponge } from "@darkforest_eth/hashing";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { BigInteger, default as bigInt } from "big-integer";
import fs from "fs";

const { readFile, writeFile } = fs.promises;

const MIMC_NUM_ROUNDS = 220;
const MIMC_KEY = 7;
const A_CHAR_CODE = "A".charCodeAt(0);

async function main(): Promise<void> {
  await writeMerkleTree("secret-wordlist", makeMimcTree);
  await writeMerkleTree("guess-wordlist", makeKeccakTree);
}

async function writeMerkleTree(
  wordlistName: string,
  buildTree: (words: string[]) => unknown
): Promise<void> {
  const words = await readLines(`inputs/${wordlistName}.txt`);
  const tree = buildTree(words);
  await writeFile(`dist/${wordlistName}-tree.json`, JSON.stringify(tree));
}

async function readLines(filename: string): Promise<string[]> {
  const contents = await readFile(filename);
  return contents
    .toString("utf-8")
    .split("\n")
    .filter((s) => s.length > 0);
}

function makeKeccakTree(words: string[]): unknown {
  const tree = StandardMerkleTree.of(
    words.map((word) => [wordToNumber(word)]),
    ["uint256"]
  );
  return tree.dump();
}

/**
 * Makes a Merkle tree whose proofs can be validated in circuits. This differs
 * from the trees produced in OpenZeppelin's library in three ways:
 *
 * - It uses the circuit-friendly MIMC hash instead of keccak.
 * - The tree is perfectly balanced, achieved by repeating the last word until
 *   the word count is a power of two.
 * - It does *not* sort the two inputs to the hash, as comparisons are expensive
 *   in circuits. Instead, the proof will indicate the order of the inputs at
 *   each step.
 */
function makeMimcTree(words: string[]): string[] {
  if (words.length === 0) {
    throw new Error("words must be nonempty");
  }
  const paddedWordCount = nextPowerOfTwo(words.length);
  padToPowerOfTwoWords(words);
  const tree: BigInteger[] = new Array(2 * paddedWordCount - 1);
  for (let i = 0; i < words.length; i++) {
    tree[i + paddedWordCount - 1] = bigInt(wordToNumber(words[i]));
  }
  const lastWord = bigInt(wordToNumber(words[words.length - 1]));
  for (let i = words.length; i < paddedWordCount; i++) {
    tree[i + paddedWordCount - 1] = lastWord;
  }
  for (let i = tree.length - 2; i > 0; i -= 2) {
    tree[(i - 1) / 2] = hashTwo(tree[i], tree[i + 1]);
  }
  return tree.map((n) => `0x${n.toString(16)}`);
}

function wordToNumber(word: string): number {
  let out = 0;
  for (let i = 0; i < word.length; i++) {
    const n = word.charCodeAt(i) - A_CHAR_CODE;
    out = out * 26 + n;
  }
  return out;
}

function hashTwo(a: BigInteger, b: BigInteger): BigInteger {
  return mimcSponge([a, b], 1, MIMC_NUM_ROUNDS, MIMC_KEY)[0];
}

function padToPowerOfTwoWords(words: string[]): void {
  // Repeat the last word to fill up the remaining length.
  const targetLength = nextPowerOfTwo(words.length);
  while (words.length < targetLength) {
    words.push(words[words.length - 1]);
  }
}

function nextPowerOfTwo(n: number): number {
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n + 1;
}

main();
