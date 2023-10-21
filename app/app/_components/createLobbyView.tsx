"use client";
import { useRouter } from "next/navigation";
import { memo, ReactNode, useCallback, useState } from "react";
import { Hex, zeroAddress } from "viem";
import { useMutation } from "wagmi";

import { useCreateLobby } from "../_lib/createLobby";
import { LobbyConfig } from "../_lib/gameLogic";
import {
  getGuessWordMerkleTree,
  getSecretWordMerkleTree,
} from "../_lib/merkle";
import LoadingButton from "./loadingButton";

export default memo(function CreateLobbyView(): ReactNode {
  const createLobby = useCreateLobby();
  const navigateToLobby = useNavigateToLobby();
  const mutation = useMutation({
    mutationFn: async () => {
      const config = await getLobbyConfig();
      return createLobby!(config);
    },
    onSuccess: navigateToLobby,
  });
  const onClickCreateLobby = useCallback(() => mutation.mutate(), [mutation]);

  const buttonText = (() => {
    if (!createLobby) {
      return "Loading";
    } else if (mutation.isLoading) {
      return "Creating lobby";
    } else {
      return "Create lobby";
    }
  })();

  const isEnabled = createLobby && !mutation.isLoading && !mutation.isSuccess;

  return (
    <div className="card w-full max-w-xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Create a lobby</h2>
        <p>Create a lobby, then find some opponents to play!</p>
        <div className="h-4" />
        <div className="card-actions justify-end">
          <LoadingButton
            className="btn btn-primary"
            disabled={!isEnabled}
            isLoading={mutation.isLoading}
            onClick={onClickCreateLobby}
          >
            {buttonText}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
});

async function getLobbyConfig(): Promise<LobbyConfig> {
  const [secretTree, guessTree] = await Promise.all([
    getSecretWordMerkleTree(),
    getGuessWordMerkleTree(),
  ]);
  const secretWordMerkleRoot = secretTree.root;
  const guessWordMerkleRoot = guessTree.root as Hex;
  return {
    secretWordMerkleRoot,
    privateGamePublicKey: zeroAddress,
    minPlayers: 0,
    maxPlayers: 1000,
    guessWordMerkleRoot,
    maxCommitGuessTime: 300,
    maxRevealGuessTime: 60,
    maxRevealMatchesTime: 60,
    maxRounds: 0,
    numLives: 3,
    pointsForYellow: 2,
    pointsForGreen: 5,
    pointsForFullWord: 10,
  };
}

function useNavigateToLobby(): (lobbyId: bigint) => void {
  const router = useRouter();
  return useCallback(
    (lobbyId: bigint) => router.push(`/lobby#${lobbyId}`),
    [router],
  );
}
