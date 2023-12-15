import clsx from "clsx";
import { memo, ReactNode, useEffect } from "react";

import { usePrevious } from "../_lib/hooks";
import { useCreateSubscription } from "../_lib/subscriptions";
import LivesIndicator from "./livesIndicator";
import PulseOnDemandBox from "./pulseOnDemandBox";

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
  const [pulseScore, subscribeToPulseScore] = useCreateSubscription<void>();
  const previousScore = usePrevious(score);

  useEffect(() => {
    if (previousScore !== undefined && previousScore !== score) {
      pulseScore();
    }
  }, [previousScore, score, pulseScore]);

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
          {isCurrentPlayer && (
            <span className="ml-1 text-sm text-gray-500">(you)</span>
          )}
          {isThinking && (
            <span className="loading loading-bars loading-xs ml-2 opacity-30" />
          )}
        </div>
        <div className="w-20 overflow-hidden text-ellipsis text-xs text-gray-400">
          {address}
        </div>
      </div>
      <div className="flex-col text-right">
        <PulseOnDemandBox
          className="text-3xl"
          subscribeToPulses={subscribeToPulseScore}
        >
          {score}
        </PulseOnDemandBox>
        <LivesIndicator
          maxLives={maxLives}
          livesLeft={livesLeft}
          isEliminated={isEliminated}
        />
      </div>
    </div>
  );
});

function ellipsizeAddress(address: string): string {
  return address.slice(0, 9) + "…";
}
