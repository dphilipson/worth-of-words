import Link from "next/link";
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
      <div className="mt-16 flex w-full max-w-[38rem] flex-col items-center space-y-8 px-4">
        <ConnectedPlayerList className="max-h-[24rem]" />
        <Link
          className="mt-5 text-lg !font-semibold text-neutral-content hover:underline"
          href="/"
        >
          Return home
        </Link>
      </div>
    </>
  );
});
