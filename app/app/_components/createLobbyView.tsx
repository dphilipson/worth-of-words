"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { memo, ReactNode, useCallback, useEffect, useRef } from "react";

import findOpponentsImage from "../_images/find-opponents.png";
import { useCreateLobby } from "../_lib/createLobby";
import { GameSpeed, getLobbyPreset } from "../_lib/lobbyPresets";
import { useHideWelcomeBack } from "../_lib/login";
import { useWallet } from "../_lib/useWallet";
import Card from "./card";
import LoadingButton from "./loadingButton";
import { useDefaultLobbyId } from "./lobbyWrapper";
import MainCard from "./mainCard";
import PulseOnEnterBox from "./pulseOnEnterBox";

export default memo(function CreateLobbyView(): ReactNode {
  const createLobby = useCreateLobby();
  const navigateToLobby = useNavigateToLobby();
  const wallet = useWallet();
  const [hideWelcomeBack, setHideWelcomeBack] = useHideWelcomeBack();
  const initialHideWelcomeBack = useRef(hideWelcomeBack).current;

  const mutation = useMutation({
    mutationFn: async () => {
      const config = await getLobbyPreset(GameSpeed.FAST);
      return createLobby!(config);
    },
    onSuccess: navigateToLobby,
  });

  const onClickCreateLobby = useCallback(() => mutation.mutate(), [mutation]);
  const isDisplayingWelcomeBack = wallet && !initialHideWelcomeBack;

  useEffect(() => {
    if (isDisplayingWelcomeBack) {
      setHideWelcomeBack(true);
    }
  }, [isDisplayingWelcomeBack, setHideWelcomeBack]);

  const isLoading = !createLobby || mutation.isPending || mutation.isSuccess;

  const buttonText = (() => {
    if (!createLobby) {
      return "Loading";
    } else if (isLoading) {
      return "Creating lobby";
    } else {
      return "Create a lobby";
    }
  })();

  return (
    <div className="flex flex-col space-y-6">
      <MainCard
        title="Find some opponents to play"
        image={findOpponentsImage}
        imageAlt="Picture of finding opponents"
        imageHasPriority={true}
      >
        <p>Only one person in your group needs to create a lobby.</p>
        <LoadingButton
          className="btn btn-primary"
          isLoading={isLoading}
          onClick={onClickCreateLobby}
        >
          {buttonText}
        </LoadingButton>
      </MainCard>
      {isDisplayingWelcomeBack && (
        <PulseOnEnterBox>
          <Card
            className="bg-[#EDE9FE]"
            isFullWidth={true}
            noDefaultBackground={true}
          >
            <h4>Good to see you again!</h4>
            <p>
              You&apos;ve been automatically signed in with your modular account
              through passkeys.
            </p>
          </Card>
        </PulseOnEnterBox>
      )}
    </div>
  );
});

function useNavigateToLobby(): (lobbyId: bigint) => void {
  const [, setDefaultLobbyId] = useDefaultLobbyId();
  const router = useRouter();
  return useCallback(
    (lobbyId: bigint) => {
      setDefaultLobbyId(lobbyId + "");
      router.push(`/app/lobby#${lobbyId}`);
    },
    [setDefaultLobbyId, router],
  );
}
