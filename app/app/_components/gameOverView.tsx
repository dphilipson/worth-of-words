import { memo, ReactNode } from "react";

import { Phase } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";
import Card from "./card";
import ConnectedPlayerList from "./connectedPlayerList";

export default memo(function GameOverView(): ReactNode {
  const { lobby } = useLobby();
  const statusText =
    lobby.phase === Phase.GAME_OVER
      ? "The game has ended"
      : "You are eliminated";
  return (
    <>
      <Card className="mb-10">
        <h1 className="text-4xl">{statusText}</h1>
      </Card>
      <ConnectedPlayerList />
    </>
  );
});
