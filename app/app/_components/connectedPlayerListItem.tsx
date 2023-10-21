import { memo, ReactNode } from "react";
import { Address } from "viem";

import { LobbyState, Phase, Player } from "../_lib/gameLogic";
import { LobbyContext, useLobby } from "../_lib/useLobby";
import PlayerListItem, { PlayerListItemProps } from "./playerListItem";

export interface ConnectedPlayerListItemProps {
  playerAddress: Address;
}

export default memo(function ConnectedPlayerListItem({
  playerAddress,
}: ConnectedPlayerListItemProps): ReactNode {
  const context = useLobby();
  return <PlayerListItem {...playerPropsFromContext(context, playerAddress)} />;
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
    isThinking: isThinking(lobby, player),
    isEliminated: player.isEliminated,
  };
}

function isThinking(lobby: LobbyState, player: Player): boolean {
  if (player.isEliminated) {
    return false;
  }
  switch (lobby.currentPhase) {
    case Phase.COMMITING_GUESSES:
      return !player.hasCommittedGuess;
    case Phase.REVEALING_GUESSES:
      return player.hasCommittedGuess && !player.revealedGuess;
    case Phase.REVEALING_MATCHES:
      return !player.hasRevealedMatches;
    case Phase.NOT_STARTED:
    case Phase.GAME_OVER:
      return false;
    default:
      // Assert never.
      throw ((_: never) => 0)(lobby.currentPhase);
  }
}
