import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { Groth16Proof, PublicSignals } from "snarkjs";

import builder from "@/app/_generated/witness_calculator";

import { newOneTimeLoader, waitForGlobal } from "./loading";

export type Prover<T> = (input: T) => Promise<ProofCallData>;

export type Pair<T> = [T, T];
export type ProofCallData = {
  _pA: Pair<bigint>;
  _pB: Pair<Pair<bigint>>;
  _pC: Pair<bigint>;
  _pubSignals: any;
};

interface ProverOut {
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}

export interface ValidWordInput {
  words: number[];
  salt: string;
  proofHashes: string[][];
  proofOrderings: number[][];
  merkleRoot: string;
}

export interface ScoreGuessInput {
  word: number[];
  salt: string;
  guesses: number[][];
}

function proofAsViemParam({ proof, publicSignals }: ProverOut): ProofCallData {
  const { pi_a, pi_b, pi_c } = proof;
  const n = BigInt;
  return {
    _pA: [n(pi_a[0]), n(pi_a[1])],
    _pB: [
      // The following line is the reverse of what you'd expect. No idea why.
      [n(pi_b[0][1]), n(pi_b[0][0])],
      [n(pi_b[1][1]), n(pi_b[1][0])],
    ],
    _pC: [n(pi_c[0]), n(pi_c[1])],
    _pubSignals: publicSignals.map(n),
  };
}

export function useProveValidWord(
  input: ValidWordInput | undefined,
): UseQueryResult<ProofCallData> {
  return useQuery({
    queryKey: ["prove-valid-word", input],
    queryFn: async () => {
      if (!input) {
        throw new Error();
      }
      const prover = await getValidWordsProver();
      return prover(input);
    },
    enabled: !!input,
    networkMode: "offlineFirst",
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useProveScoreGuess(
  input: ScoreGuessInput | undefined,
): UseQueryResult<ProofCallData> {
  return useQuery({
    queryKey: ["prove-score-guess", input],
    queryFn: async () => {
      if (!input) {
        throw new Error();
      }
      const prover = await getScoreGuessesProver();
      return prover(input);
    },
    enabled: !!input,
    networkMode: "offlineFirst",
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export const getValidWordsProver = newOneTimeLoader(() =>
  newProver<ValidWordInput>("valid_words"),
);

export const getScoreGuessesProver = newOneTimeLoader(() =>
  newProver<ScoreGuessInput>("score_guesses"),
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
      0,
    );
    const proof = await snarkjs.groth16.prove(zkey, witness);
    return proofAsViemParam(proof);
  };
}

async function newWitnessCalculator(circuitName: string): Promise<any> {
  const code = await loadBinary(`/generated/${circuitName}.wasm`);
  return builder(code);
}

async function loadZkey(circuitName: string): Promise<Uint8Array> {
  const buffer = await loadBinary(`/generated/${circuitName}.zkey`);
  return new Uint8Array(buffer);
}

async function loadBinary(path: string): Promise<ArrayBuffer> {
  const response = await fetch(path);
  return response.arrayBuffer();
}
