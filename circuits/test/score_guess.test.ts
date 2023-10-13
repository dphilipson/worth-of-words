import { beforeAll, describe, expect, it, test } from "@jest/globals";
import { wasm as wasmTester } from "circom_tester";

describe("score_guess circuit", () => {
  let circuit;

  beforeAll(async () => {
    circuit = await wasmTester("./src/score_guess.circom");
  });

  describe("handles simple scoring", () => {
    test("with mixed results", async () => {
      await expectScore({
        word: [0, 1, 2, 3, 4],
        guess: [0, 2, 10, 10, 10],
        score: [2, 1, 0, 0, 0],
      });
    });

    test("with a full green match", async () => {
      await expectScore({
        word: [0, 1, 2, 3, 4],
        guess: [0, 1, 2, 3, 4],
        score: [2, 2, 2, 2, 2],
      });
    });
  });

  describe("yellow-matches a letter only as many times as it appears in word", () => {
    test("with one occurrence in word", async () => {
      await expectScore({
        word: [0, 1, 2, 3, 4],
        guess: [10, 4, 4, 4, 10],
        score: [0, 1, 0, 0, 0],
      });
    });

    test("with multiple occurrences in word", async () => {
      await expectScore({
        word: [0, 1, 2, 3, 3],
        guess: [3, 3, 3, 10, 10],
        score: [1, 1, 0, 0, 0],
      });
    });
  });

  describe("prioritizes green matches over yellows", () => {
    test("with single green before yellow", async () => {
      await expectScore({
        word: [0, 1, 2, 3, 4],
        guess: [10, 10, 2, 2, 10],
        score: [0, 0, 2, 0, 0],
      });
    });

    test("with single green after yellow", async () => {
      await expectScore({
        word: [0, 1, 2, 3, 4],
        guess: [10, 2, 2, 10, 10],
        score: [0, 0, 2, 0, 0],
      });
    });

    test("with multiple greens before yellow", async () => {
      await expectScore({
        word: [0, 1, 2, 2, 3],
        guess: [10, 10, 2, 2, 2],
        score: [0, 0, 2, 2, 0],
      });
    });

    test("with multiple greens after yellow", async () => {
      await expectScore({
        word: [0, 1, 2, 2, 3],
        guess: [10, 2, 2, 2, 10],
        score: [0, 0, 2, 2, 0],
      });
    });

    test("with greens both before and after yellow", async () => {
      await expectScore({
        word: [0, 1, 2, 1, 3],
        guess: [10, 1, 1, 1, 10],
        score: [0, 2, 0, 2, 0],
      });
    });
  });

  type FiveNumbers = [number, number, number, number, number];

  interface ExpectScoreInput {
    word: FiveNumbers;
    guess: FiveNumbers;
    score: FiveNumbers;
  }

  async function expectScore({
    word,
    guess,
    score,
  }: ExpectScoreInput): Promise<void> {
    const witness = await circuit.calculateWitness({ word, salt: 42, guess });
    expect(Number(witness[0])).toBe(1);
    // Skip over witness[1], the commitment hash.
    expect(witness.slice(2, 7).map(Number)).toEqual(score);
  }
});
