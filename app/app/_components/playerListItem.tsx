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
  isEliminated: boolean;
}

export default memo(function PlayerListItem({
  className,
  name,
  address,
  score,
  maxLives,
  livesLeft,
  isEliminated,
}: PlayerListItemProps): ReactNode {
  return (
    <div
      className={clsx(
        "border-1 flex h-20 w-full max-w-sm items-center justify-between bg-base-100 px-4",
        className,
      )}
    >
      <div className="flex-col">
        <div className="text-2xl">{name}</div>
        <div className="text-xs text-gray-400">{ellipsizeAddress(address)}</div>
      </div>
      <div className="flex-col text-right">
        <div className="text-3xl">{score}</div>
        <div className="text-sm">{getLivesText(maxLives, livesLeft)}</div>
      </div>
    </div>
  );
});

function ellipsizeAddress(address: string): string {
  return address.slice(0, 9) + "…";
}

function getLivesText(maxLives: number, livesLeft: number): string {
  return (
    repeatString("🩶", maxLives - livesLeft) + repeatString("❤️", livesLeft)
  );
}

function repeatString(s: string, n: number): string {
  return chainFrom(repeat(s, n)).joinToString("");
}
