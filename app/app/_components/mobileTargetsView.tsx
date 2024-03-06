import { memo, ReactNode } from "react";

import { Player } from "../_lib/gameLogic";
import { SubscribeFunction } from "../_lib/subscriptions";
import ConnectedTarget from "./connectedTarget";

export interface MobileTargetsViewProps {
  defenders: Player[];
  defenderIndex: number;
  currentInput: string;
  subscribeToInputConfirm: SubscribeFunction<void>;
  setDefenderIndex(defenderIndex: number): void;
}

export default memo(function MobileTargetsView({
  defenders,
  defenderIndex: rawDefenderIndex,
  currentInput,
  subscribeToInputConfirm,
  setDefenderIndex,
}: MobileTargetsViewProps): ReactNode {
  const defenderIndex =
    rawDefenderIndex < defenders.length ? rawDefenderIndex : 0;
  const defender = defenders[defenderIndex];

  return (
    <div className="mx-auto w-full max-w-xs cursor-pointer px-3">
      <ConnectedTarget
        playerAddress={defender.address}
        currentInput={currentInput}
        subscribeToInputConfirm={subscribeToInputConfirm}
      />
    </div>
  );
});
