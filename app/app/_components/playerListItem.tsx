import clsx from "clsx";
import { memo, ReactNode } from "react";
import { chainFrom, repeat } from "transducist";

export interface PlayerListItemProps {
  className?: string;
  name: string;
  address: string;
  score: number;
  maxLives: number;
  livesLeft: number;
  isCurrentPlayer: boolean;
  isThinking: boolean;
  isEliminated: boolean;
}

export default memo(function PlayerListItem({
  className,
  name,
  address,
  score,
  maxLives,
  livesLeft,
  isCurrentPlayer,
  isThinking,
  isEliminated,
}: PlayerListItemProps): ReactNode {
  return (
    <div
      className={clsx(
        "border-1 flex h-20 w-full max-w-sm items-center justify-between px-6",
        isEliminated ? "bg-gray-200 text-gray-400" : "bg-base-100",
        isCurrentPlayer && "border-l-8 border-l-primary pl-4",
        className,
      )}
    >
      <div className="flex-col">
        <div className="text-2xl">
          {name}
          {isThinking && (
            <span className="loading loading-bars loading-xs ml-2 opacity-30" />
          )}
        </div>
        <div className="text-xs text-gray-400">{ellipsizeAddress(address)}</div>
      </div>
      <div className="flex-col text-right">
        <div className="text-3xl">{score}</div>
        <div className="text-sm">
          {getLivesText(maxLives, livesLeft, isEliminated)}
        </div>
      </div>
    </div>
  );
});

function ellipsizeAddress(address: string): string {
  return address.slice(0, 9) + "…";
}

function getLivesText(
  maxLives: number,
  livesLeft: number,
  isEliminated: boolean,
): string {
  const lifeIcon = isEliminated ? "💔" : "❤️";
  return (
    repeatString("🩶", maxLives - livesLeft) + repeatString(lifeIcon, livesLeft)
  );
}

function repeatString(s: string, n: number): string {
  return chainFrom(repeat(s, n)).joinToString("");
}
