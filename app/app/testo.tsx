"use client";
import { ReactNode } from "react";
import { chainFrom } from "transducist";

import {
  useScoreGuessVerifierRead,
  useScoreGuessVerifierVerifyProof,
} from "./_generated/wagmi";
import { proofAsCallData, useProveScoreGuess } from "./_lib/proofs";

export default function Testo(): ReactNode {
  const { data, error, isError, isSuccess } = useProveScoreGuess({
    word: [0, 1, 2, 3, 4],
    salt: 42,
    guess: [10, 1, 3, 10, 10],
  });

  const queryResult = useScoreGuessVerifierVerifyProof({
    address: "0x8597BEE3925d03f9644aC11236cEdF8f121cD1Cc",
    args: (data && proofAsCallData(data))!,
    enabled: !!data,
  });
  console.log(queryResult);

  return <div />;
}
