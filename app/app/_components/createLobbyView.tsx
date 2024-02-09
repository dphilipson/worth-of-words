"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { memo, ReactNode, useCallback, useState } from "react";

import { useCreateLobby } from "../_lib/createLobby";
import { GameSpeed, getLobbyPreset } from "../_lib/lobbyPresets";
import GameSpeedRadioGroup from "./gameSpeedRadioGroup";
import LoadingButton from "./loadingButton";

export default memo(function CreateLobbyView(): ReactNode {
  const createLobby = useCreateLobby();
  const navigateToLobby = useNavigateToLobby();
  const [speed, setSpeed] = useState(GameSpeed.FAST);
  const mutation = useMutation({
    mutationFn: async () => {
      const config = await getLobbyPreset(speed);
      return createLobby!(config);
    },
    onSuccess: navigateToLobby,
  });
  const onClickCreateLobby = useCallback(() => mutation.mutate(), [mutation]);

  const buttonText = (() => {
    if (!createLobby) {
      return "Loading";
    } else if (mutation.isPending) {
      return "Creating lobby";
    } else {
      return "Create lobby";
    }
  })();

  const isEnabled = createLobby && !mutation.isPending && !mutation.isSuccess;

  return (
    <div className="card w-full max-w-xl bg-base-100 shadow-xl">
      <div className="card-body space-y-2">
        <h2 className="card-title">Create a lobby</h2>
        <p>Create a lobby, then find some opponents to play!</p>
        <p>
          Only one person in your group needs to create a lobby. They can send a
          link to the other players.
        </p>
        <div />
        <h2 className="mt-4 text-lg">Game speed</h2>
        <GameSpeedRadioGroup speed={speed} onSpeedChange={setSpeed} />
        <div className="card-actions justify-center">
          <LoadingButton
            className="btn btn-primary"
            disabled={!isEnabled}
            isLoading={mutation.isPending}
            onClick={onClickCreateLobby}
          >
            {buttonText}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
});

function useNavigateToLobby(): (lobbyId: bigint) => void {
  const router = useRouter();
  return useCallback(
    (lobbyId: bigint) => router.push(`/app/lobby#${lobbyId}`),
    [router],
  );
}
