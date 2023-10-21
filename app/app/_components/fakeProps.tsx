import { Color } from "../_lib/gameLogic";
import { JoinLobbyViewProps } from "./joinLobbyView";
import { PlayerListItemPropsInList, PlayerListProps } from "./playerList";

export const fakePlayerData: PlayerListItemPropsInList[] = [
  {
    name: "Marvin Brooks",
    address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6C",
    score: 24,
    livesLeft: 3,
    isThinking: true,
    isEliminated: false,
  },
  {
    name: "Marvin Brooks",
    address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6E",
    score: 24,
    livesLeft: 0,
    isThinking: false,
    isEliminated: true,
  },
  {
    name: "Marvin Brooks",
    address: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6d",
    score: 24,
    livesLeft: 2,
    isThinking: false,
    isEliminated: false,
  },
];

export const fakePlayerListProps: PlayerListProps = {
  players: fakePlayerData,
  maxLives: 3,
  currentPlayerAddress: "0x696532E83Dd722eaCA2AA611fE381DfAAD143e6d",
};

// export const fakeJoinLobbyData: JoinLobbyViewProps = {
//   numSecrets: 3,
//   needsPassword: true,
//   allowedWords: new Set(["PERIL", "IMAMS"]),
//   allKnownWords: new Set(["PERIL", "IMAMS", "FARTY"]),
// };

const mockColorsByLetter: Map<string, Color>[] = (() => {
  const maps = [new Map(), new Map(), new Map()];
  maps[0].set("U", Color.GRAY);
  maps[0].set("A", Color.GREEN);
  maps[0].set("G", Color.GREEN);
  maps[1].set("A", Color.GRAY);
  maps[1].set("G", Color.GREEN);
  maps[1].set("I", Color.YELLOW);
  maps[2].set("X", Color.GRAY);
  maps[2].set("G", Color.GRAY);
  maps[2].set("A", Color.YELLOW);
  return maps;
})();
