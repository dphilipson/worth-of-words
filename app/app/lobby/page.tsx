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

// const playerData: PlayerListItemPropsInList[] = [
//   {
//     name: "Marvin Brooks",
//     address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6C",
//     score: 24,
//     livesLeft: 3,
//     isThinking: true,
//     isEliminated: false,
//   },
//   {
//     name: "Marvin Brooks",
//     address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6E",
//     score: 24,
//     livesLeft: 1,
//     isThinking: false,
//     isEliminated: true,
//   },
//   {
//     name: "Marvin Brooks",
//     address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6d",
//     score: 24,
//     livesLeft: 2,
//     isThinking: false,
//     isEliminated: false,
//   },
// ];

// const rows: GuessRowProps[] = [
//   {
//     word: "PARTY",
//     colors: [Color.GRAY, Color.YELLOW, Color.GRAY, Color.YELLOW, Color.GRAY],
//   },
//   {
//     word: "SLICE",
//     colors: [Color.GRAY, Color.YELLOW, Color.GRAY, Color.GRAY, Color.GRAY],
//   },
//   {
//     word: "LATEN",
//     colors: [Color.YELLOW, Color.YELLOW, Color.YELLOW, Color.GRAY, Color.GRAY],
//   },
//   {
//     word: "TABLA",
//     colors: [Color.YELLOW, Color.YELLOW, Color.GRAY, Color.GREEN, Color.GRAY],
//   },
// ];

export default function Lobby(): ReactNode {
  const { playerAddress, lobby } = useLobby();
  const playerIsInLobby = lobby.playersByAddress.has(playerAddress);

  const children = (() => {
    if (!playerIsInLobby) {
      if (lobby.currentPhase === Phase.NOT_STARTED) {
        return <ConnectedJoinLobbyView />;
      } else {
        return (
          <ErrorView>This game has already started without you.</ErrorView>
        );
      }
    }
    if (lobby.currentPhase === Phase.NOT_STARTED) {
      return <WaitingRoomView />;
    }
    return <GameplayView />;
  })();

  return (
    <main className="flex min-h-screen flex-col items-center pt-24">
      {children}
      {/* <ConnectKitButton /> */}
      {/* <PlayerList
        players={playerData}
        maxLives={3}
        currentPlayerAddress="0x696532E83Dd722eaCA2AA611fE381DfAAD143e6d"
      /> */}
      {/* <JoinLobbyView
        numSecrets={3}
        needsPassword={true}
        allowedWords={new Set(["PERIL", "IMAMS"])}
        allKnownWords={new Set(["PERIL", "IMAMS", "FARTY"])}
        onJoin={console.log}
      /> */}
      {/* <WaitingRoomView
        players={playerData}
        maxLives={3}
        currentPlayerAddress="0x696532E83Dd722eaCA2AA611fE381DfAAD143e6d"
        minPlayerCount={2}
        onStartGame={() => {}}
      /> */}
      {/* <GuessingView
          opponents={playerData.map((data) => ({ ...data, rows }))}
          maxLives={3}
          validGuesses={new Set(["PERIL", "IMAMS", "FARTY"])}
          onSubmitGuess={console.log}
        /> */}
    </main>
  );
}
