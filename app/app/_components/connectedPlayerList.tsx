import { memo, ReactNode } from "react";
import { chainFrom, repeat } from "transducist";

import { useLobby } from "../_lib/useLobby";
import { playerPropsFromContext } from "./connectedPlayerListItem";
import PlayerList from "./playerList";

export interface ConnectedPlayerListProps {
  className?: string;
  compact?: boolean;
}

export default memo(function ConnectedPlayerList({
  className,
  compact,
}: ConnectedPlayerListProps): ReactNode {
  const context = useLobby();
  const players = chainFrom(context.lobby.playersByAddress.keys())
    .map((playerAddress) => playerPropsFromContext(context, playerAddress))
    .toArray();
  return (
    <PlayerList
      className={className}
      players={players}
      maxLives={context.lobby.config.numLives}
      currentPlayerAddress={context.playerAddress}
      compact={compact}
    />
  );
});
