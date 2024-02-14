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
        "w-full py-4 pr-4",
        isEliminated ? "bg-gray-200 text-gray-400" : "bg-base-100",
        isCurrentPlayer ? "border-l-8 border-l-primary pl-2" : "pl-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <span className="text-lg font-bold">{name}</span>
          {isCurrentPlayer && (
            <span className="text-xs text-secondary">(you)</span>
          )}
          {isThinking && (
            <span className="loading loading-bars loading-xs ml-2 opacity-30" />
          )}
        </div>
        <PulseOnDemandBox
          className="text-2xl font-bold"
          subscribeToPulses={subscribeToPulseScore}
        >
          {score}
        </PulseOnDemandBox>
      </div>
      <div className="flex items-center justify-between">
        <div className="w-20 overflow-hidden text-ellipsis text-xs text-secondary">
          {address}
        </div>
        <LivesIndicator
          maxLives={maxLives}
          livesLeft={livesLeft}
          isEliminated={isEliminated}
        />
      </div>
    </div>
  );
});
