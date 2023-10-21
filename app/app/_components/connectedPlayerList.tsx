import { memo, ReactNode } from "react";
import { chainFrom } from "transducist";

import { useLobby } from "../_lib/useLobby";
import { playerPropsFromContext } from "./connectedPlayerListItem";
import PlayerList from "./playerList";

export default memo(function ConnectedPlayerList(): ReactNode {
  const context = useLobby();
  const players = chainFrom(context.lobby.playersByAddress.keys())
    .map((playerAddress) => playerPropsFromContext(context, playerAddress))
    .toArray();
  return (
    <PlayerList
      players={players}
      maxLives={context.lobby.config.numLives}
      currentPlayerAddress={context.playerAddress}
    />
  );
});
