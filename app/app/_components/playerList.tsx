import clsx from "clsx";
import { memo, ReactNode, useMemo } from "react";

import PlayerListItem, { PlayerListItemProps } from "./playerListItem";

export interface PlayerListProps {
  className?: string;
  players: PlayerListItemPropsInList[];
  maxLives: number;
  currentPlayerAddress: string;
  compact?: boolean;
}

export type PlayerListItemPropsInList = Omit<
  PlayerListItemProps,
  "maxLives" | "isCurrentPlayer"
>;

export default memo(function PlayerList({
  className,
  players,
  maxLives,
  currentPlayerAddress,
  compact,
}: PlayerListProps): ReactNode {
  const sortedPlayers = useMemo(() => {
    const items: PlayerListItemProps[] = players.map((player) => ({
      ...player,
      maxLives,
      isCurrentPlayer: player.address === currentPlayerAddress,
    }));
    items.sort(comparator);
    return items;
  }, [players, maxLives, currentPlayerAddress]);
  return (
    <div
      className={clsx(
        "flex w-full flex-col overflow-auto",
        compact ? "space-y-0.5 rounded-lg bg-gray-300 shadow-xl" : "space-y-2",
        className,
      )}
    >
      {sortedPlayers.map((player) => (
        <PlayerListItem key={player.address} {...player} />
      ))}
    </div>
  );
});

function comparator(a: PlayerListItemProps, b: PlayerListItemProps): number {
  if (a.score !== b.score) {
    return b.score - a.score;
  }
  if (a.livesLeft !== b.livesLeft) {
    return b.livesLeft - a.livesLeft;
  }
  if (a.isCurrentPlayer !== b.isCurrentPlayer) {
    return a.isCurrentPlayer ? -1 : 1;
  }
  const nameCompare = compareStrings(a.name, b.name);
  if (nameCompare !== 0) {
    return nameCompare;
  }
  return compareStrings(a.address, b.address);
}

function compareStrings(a: string, b: string): number {
  if (a < b) {
    return -1;
  } else if (a === b) {
    return 0;
  } else {
    return 1;
  }
}
