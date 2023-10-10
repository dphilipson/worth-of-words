import type { Groth16Proof, PublicSignals } from "snarkjs";

import builder from "@/app/_generated/witness_calculator";

declare const snarkjs: typeof import("snarkjs");

export type Prover<T> = (input: T) => Promise<{
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}>;

export async function doStuff(): Promise<void> {
  interface ScoreGuessInput {
    word: number[];
    salt: number;
    guess: number[];
  }

  const prover = await newProver<ScoreGuessInput>("score_guess");
  const { proof, publicSignals } = await prover({
    word: [0, 1, 2, 3, 4],
    salt: 42,
    guess: [10, 1, 3, 10, 10],
  });
  console.log({ proof, publicSignals });
}

export async function newProver<T>(circuitName: string): Promise<Prover<T>> {
  const [witnessCalculator, zkey] = await Promise.all([
    newWitnessCalculator(circuitName),
    loadZkey(circuitName),
  ]);
  return async (input) => {
    const witness: Uint8Array = await witnessCalculator.calculateWTNSBin(
      input,
      0
    );
    // const callData = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    return snarkjs.groth16.prove(zkey, witness);
  };
}

async function newWitnessCalculator(circuitName: string): Promise<any> {
  const code = await loadBinary(`./generated/${circuitName}.wasm`);
  return builder(code);
}

async function loadZkey(circuitName: string): Promise<Uint8Array> {
  const buffer = await loadBinary(`./generated/${circuitName}.zkey`);
  return new Uint8Array(buffer);
}

async function loadBinary(path: string): Promise<ArrayBuffer> {
  const response = await fetch(path);
  return response.arrayBuffer();
}
