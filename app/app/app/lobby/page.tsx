"use client";

import { ReactNode } from "react";

import ConnectedJoinLobbyView from "@/app/_components/connectedJoinLobbyView";
import ErrorView from "@/app/_components/errorView";
import GameplayView from "@/app/_components/gameplayView";
import WaitingRoomView from "@/app/_components/waitingRoomView";
import { Phase } from "@/app/_lib/gameLogic";
import { useLobby } from "@/app/_lib/useLobby";

export default function Lobby(): ReactNode {
  const { playerAddress, lobby } = useLobby();
  const playerIsInLobby = lobby.playersByAddress.has(playerAddress);
  if (!playerIsInLobby) {
    if (lobby.phase === Phase.NOT_STARTED) {
      return <ConnectedJoinLobbyView />;
    } else {
      return <ErrorView>This game has already started without you.</ErrorView>;
    }
  }
  if (lobby.phase === Phase.NOT_STARTED) {
    return <WaitingRoomView />;
  }
  return <GameplayView />;
}
