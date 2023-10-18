import { memo, ReactNode } from "react";

import PlayerList, { PlayerListProps } from "./playerList";

export interface WaitingRoomViewProps extends PlayerListProps {
  minPlayerCount: number;
  onStartGame(): void;
}

export default memo(function WaitingRoomView({
  minPlayerCount,
  onStartGame,
  ...playerListProps
}: WaitingRoomViewProps): ReactNode {
  const canStartGame = playerListProps.players.length >= minPlayerCount;

  return (
    <div className="flex w-full flex-col items-center space-y-20">
      <PlayerList {...playerListProps} />
      <button
        className="btn btn-primary"
        disabled={!canStartGame}
        onClick={canStartGame ? onStartGame : undefined}
      >
        {canStartGame ? "Start game" : "Waiting for players"}
      </button>
    </div>
  );
});
