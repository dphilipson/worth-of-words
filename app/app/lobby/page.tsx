"use client";
import { ConnectKitButton } from "connectkit";
import { ReactNode, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

import ConnectedJoinLobbyView from "../_components/connectedJoinLobbyView";
import ErrorView from "../_components/errorView";
import GameplayView from "../_components/gameplayView";
import { ScoredRowProps } from "../_components/guessGrid";
import GuessingView from "../_components/guessingView";
import JoinLobbyView from "../_components/joinLobbyView";
import LobbyWrapper from "../_components/lobbyWrapper";
import PlayerList, {
  PlayerListItemPropsInList,
} from "../_components/playerList";
import {} from "../_components/playerListItem";
import WaitingRoomView from "../_components/waitingRoomView";
import { Color, Phase } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";

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
