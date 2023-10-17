// "use client";
// import { ReactNode } from "react";
// import { chainFrom } from "transducist";

// import {
//   useScoreGuessVerifierRead,
//   useScoreGuessVerifierVerifyProof,
//   useValidWordVerifierVerifyProof,
// } from "./_generated/wagmi";
// import { MerkleProof, useSecretWordMerkleTree } from "./_lib/merkle";
// import {
//   useProveScoreGuess,
//   useProveValidWord,
//   ValidWordInput,
// } from "./_lib/proofs";
// import { getSecretWordlist, wordToLetters, wordToNumber } from "./_lib/words";

// export default function Testo(): ReactNode {
//   const { data: tree, error } = useSecretWordMerkleTree();
//   if (error) {
//     console.error(error);
//   }
//   let merkleProof: MerkleProof | undefined;
//   if (tree) {
//     const index = tree.getIndex("BLAME");
//     merkleProof = tree.getProof(index!);
//   }
//   getSecretWordlist().then((wordlist) => ((window as any).wordlist = wordlist));

//   const { data: proof, error: provingError } = useProveValidWord(
//     merkleProof && {
//       word: wordToNumber("BLAME"),
//       salt: "42",
//       ...merkleProof,
//     }
//   );
//   if (provingError) {
//     console.error(provingError);
//   }
//   if (proof) {
//     console.log("Proof:", proof);
//   }
//   const queryResult = useValidWordVerifierVerifyProof({
//     address: "0xa4C7252115937FFa9992Bb2204CdA902A9090eC2",
//     args: proof,
//     enabled: !!proof,
//   });
//   queryResult.data && console.log("Verified:", queryResult.data);
//   queryResult.data &&
//     console.log("Root matches:", proof?.[3][1] === tree?.root);

//   // const { data, error, isError, isSuccess } = useProveScoreGuess({
//   //   word: [0, 1, 2, 3, 4],
//   //   salt: 42,
//   //   guess: [10, 1, 3, 10, 10],
//   // });

//   // const queryResult = useScoreGuessVerifierVerifyProof({
//   //   address: "0x8597BEE3925d03f9644aC11236cEdF8f121cD1Cc",
//   //   args: (data && proofAsCallData(data))!,
//   //   enabled: !!data,
//   // });
//   // console.log(queryResult);

//   return <div />;
// }
