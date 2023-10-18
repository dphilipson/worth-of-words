import { memo, ReactNode } from "react";

import PlayerListItem, { PlayerListItemProps } from "./playerListItem";

export interface PlayerListProps {
  players: PlayerListItemPropsInList[];
  maxLives: number;
}

export type PlayerListItemPropsInList = Omit<PlayerListItemProps, "maxLives">;

export default memo(function PlayerList({
  players,
  maxLives,
}: PlayerListProps): ReactNode {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg shadow-xl">
      {players.map((player) => (
        <PlayerListItem
          key={player.address}
          className="border-b-2 border-gray-300 last:border-b-0"
          {...player}
          maxLives={maxLives}
        />
      ))}
    </div>
  );
});
