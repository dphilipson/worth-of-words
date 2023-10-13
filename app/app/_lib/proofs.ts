import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { Groth16Proof, PublicSignals } from "snarkjs";

import builder from "@/app/_generated/witness_calculator";

export type Prover<T> = (input: T) => Promise<ProverOut>;

interface ProverOut {
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}

export interface ScoreGuessInput {
  word: number[];
  salt: number;
  guess: number[];
}

export type Pair<T> = [T, T];
export type ProofAsCallData = [
  Pair<bigint>,
  Pair<Pair<bigint>>,
  Pair<bigint>,
  any, // bigint[], but needs any to satisfy varying fixed array types
];

export function proofAsCallData({
  proof,
  publicSignals,
}: ProverOut): ProofAsCallData {
  const { pi_a, pi_b, pi_c } = proof;
  const n = BigInt;
  return [
    [n(pi_a[0]), n(pi_a[1])],
    [
      [n(pi_b[0][1]), n(pi_b[0][0])],
      [n(pi_b[1][1]), n(pi_b[1][0])],
    ],
    [n(pi_c[0]), n(pi_c[1])],
    publicSignals.map(n),
  ];
}

export function useProveScoreGuess(
  input: ScoreGuessInput
): UseQueryResult<ProverOut> {
  return useQuery({
    queryKey: ["proveScoreGuess", input],
    queryFn: async () => {
      const prover = await getScoreGuessProver();
      return prover(input);
    },
    networkMode: "offlineFirst",
    staleTime: Number.POSITIVE_INFINITY,
  });
}

const getScoreGuessProver = newOneTimeLoader(() =>
  newProver<ScoreGuessInput>("score_guess")
);

function newOneTimeLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let resolve: (out: T) => void;
  let reject: (error: unknown) => void;
  let isStarted = false;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return () => {
    if (!isStarted) {
      isStarted = true;
      load().then(resolve, reject);
    }
    return promise;
  };
}

async function newProver<T>(circuitName: string): Promise<Prover<T>> {
  const [snarkjs, witnessCalculator, zkey] = await Promise.all([
    waitForGlobal<typeof import("snarkjs")>("snarkjs"),
    newWitnessCalculator(circuitName),
    loadZkey(circuitName),
  ]);
  return async (input) => {
    const witness: Uint8Array = await witnessCalculator.calculateWTNSBin(
      input,
      0
    );
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

function waitForGlobal<T>(key: string): Promise<T> {
  const value = (window as any)[key];
  if (value !== undefined) {
    return Promise.resolve(value);
  }
  return new Promise((resolve) =>
    Object.defineProperty(window, key, {
      configurable: true,
      set(x) {
        delete (window as any)[key];
        (window as any)[key] = x;
        resolve(x);
      },
    })
  );
}
