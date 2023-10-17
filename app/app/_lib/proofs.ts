import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { Groth16Proof, PublicSignals } from "snarkjs";

import builder from "@/app/_generated/witness_calculator";

import { newOneTimeLoader, waitForGlobal } from "./loading";

export type Prover<T> = (input: T) => Promise<ProofCallData>;

export type Pair<T> = [T, T];
export type ProofCallData = [
  Pair<bigint>,
  Pair<Pair<bigint>>,
  Pair<bigint>,
  any, // bigint[], but needs any to satisfy varying fixed array types
];

interface ProverOut {
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}

export interface ValidWordInput {
  word: number;
  salt: string;
  proofHashes: string[];
  proofOrderings: number[];
}

export interface ScoreGuessInput {
  word: number[];
  salt: string;
  guess: number[];
}

function proofAsCallData({ proof, publicSignals }: ProverOut): ProofCallData {
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

export function useProveValidWord(
  input: ValidWordInput | undefined
): UseQueryResult<ProofCallData> {
  return useQuery({
    queryKey: ["prove-valid-word", input],
    queryFn: async () => {
      if (!input) {
        throw new Error();
      }
      const prover = await getValidWordProver();
      return prover(input);
    },
    enabled: !!input,
    networkMode: "offlineFirst",
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useProveScoreGuess(
  input: ScoreGuessInput | undefined
): UseQueryResult<ProofCallData> {
  return useQuery({
    queryKey: ["prove-score-guess", input],
    queryFn: async () => {
      if (!input) {
        throw new Error();
      }
      const prover = await getScoreGuessProver();
      return prover(input);
    },
    enabled: !!input,
    networkMode: "offlineFirst",
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export const getValidWordProver = newOneTimeLoader(() =>
  newProver<ValidWordInput>("valid_word")
);

export const getScoreGuessProver = newOneTimeLoader(() =>
  newProver<ScoreGuessInput>("score_guess")
);

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
    const proof = await snarkjs.groth16.prove(zkey, witness);
    return proofAsCallData(proof);
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
