import { memo, ReactNode } from "react";
import { Address } from "viem";

import { playerIsThinking } from "../_lib/gameLogic";
import { LobbyContext, useLobby } from "../_lib/useLobby";
import PlayerListItem, { PlayerListItemProps } from "./playerListItem";

export interface ConnectedPlayerListItemProps {
  playerAddress: Address;
}

export default memo(function ConnectedPlayerListItem({
  playerAddress,
}: ConnectedPlayerListItemProps): ReactNode {
  const context = useLobby();
  return (
    <PlayerListItem
      className="rounded-lg shadow-xl"
      {...playerPropsFromContext(context, playerAddress)}
    />
  );
});

export function playerPropsFromContext(
  context: LobbyContext,
  playerAddress: Address,
): PlayerListItemProps {
  const { playerAddress: currentPlayerAddress, lobby } = context;
  const player = lobby.playersByAddress.get(playerAddress);
  if (player === undefined) {
    throw new Error("Player address not found in lobby: " + playerAddress);
  }
  return {
    name: player.name,
    address: playerAddress,
    score: player.score,
    maxLives: lobby.config.numLives,
    livesLeft: player.livesLeft,
    isCurrentPlayer: playerAddress === currentPlayerAddress,
    isThinking: playerIsThinking(lobby, player),
    isEliminated: player.isEliminated,
  };
}
