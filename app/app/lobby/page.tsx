"use client";
import { ReactNode } from "react";

import PlayerList, {
  PlayerListItemPropsInList,
} from "../_components/playerList";
import {} from "../_components/playerListItem";
import JoinLobbyView from "./_components/joinLobbyView";

const playerData: PlayerListItemPropsInList[] = [
  {
    name: "Marvin Brooks",
    address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6C",
    score: 24,
    livesLeft: 3,
    isEliminated: false,
  },
  {
    name: "Marvin Brooks",
    address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6C",
    score: 24,
    livesLeft: 0,
    isEliminated: true,
  },
  {
    name: "Marvin Brooks",
    address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6C",
    score: 24,
    livesLeft: 2,
    isEliminated: true,
  },
];

export default function Lobby(): ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center pt-24">
      {/* <PlayerList players={playerData} maxLives={3} /> */}
      <JoinLobbyView
        numSecrets={3}
        allowedWords={new Set(["PERIL", "IMAMS"])}
        allKnownWords={new Set(["PERIL", "IMAMS", "FARTY"])}
        onConfirm={console.log}
      />
    </main>
  );
}
