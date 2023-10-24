import { memo, ReactNode, useMemo } from "react";

import { getSortedDefenders } from "../_lib/gameLogic";
import { SubscribeFunction } from "../_lib/subscriptions";
import { useLobby } from "../_lib/useLobby";
import ConnectedGuessGrid from "./connectedGuessGrid";
import ConnectedPlayerListItem from "./connectedPlayerListItem";

export interface TargetsViewProps {
  currentInput: string;
  onHoverChange(index: number | undefined): void;
  subscribeToInputConfirm: SubscribeFunction<void>;
}

export default memo(function TargetsView({
  currentInput,
  onHoverChange,
  subscribeToInputConfirm,
}: TargetsViewProps): ReactNode {
  const { playerAddress, lobby } = useLobby();
  const defenders = useMemo(
    () => getSortedDefenders(lobby, playerAddress),
    [lobby, playerAddress],
  );
  return (
    <div className="flex w-full justify-around">
      {defenders.map((defender, i) => {
        return (
          <div
            key={defender.address}
            className="flex w-full max-w-xs cursor-pointer flex-col items-center space-y-4 rounded-xl p-3 transition-colors hover:bg-black hover:bg-opacity-10"
            onMouseEnter={() => onHoverChange(i)}
            onMouseLeave={() => onHoverChange(undefined)}
          >
            <ConnectedPlayerListItem playerAddress={defender.address} />
            <ConnectedGuessGrid
              playerAddress={defender.address}
              currentInput={currentInput}
              isSelfGrid={false}
              subscribeToInputConfirm={subscribeToInputConfirm}
            />
          </div>
        );
      })}
    </div>
  );
});
