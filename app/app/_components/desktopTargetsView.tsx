import { memo, ReactNode, useEffect } from "react";

import { Player } from "../_lib/gameLogic";
import { useLatestRef } from "../_lib/hooks";
import { SubscribeFunction } from "../_lib/subscriptions";
import ConnectedTarget from "./connectedTarget";

export interface DesktopTargetsViewProps {
  defenders: Player[];
  currentInput: string;
  onHoverChange(index: number | undefined): void;
  subscribeToInputConfirm: SubscribeFunction<void>;
}

export default memo(function DesktopTargetsView({
  defenders,
  currentInput,
  onHoverChange,
  subscribeToInputConfirm,
}: DesktopTargetsViewProps): ReactNode {
  const onHoverChangeRef = useLatestRef(onHoverChange);

  useEffect(
    () => () => {
      onHoverChangeRef.current(undefined);
    },
    [onHoverChangeRef],
  );

  return (
    <div className="flex w-full justify-around">
      {defenders.map((defender, i) => (
        <div
          key={defender.address}
          className="w-full max-w-xs cursor-pointer rounded-xl p-3 transition-colors hover:bg-gray-500 hover:bg-opacity-40"
          onMouseEnter={() => onHoverChange(i)}
          onMouseLeave={() => onHoverChange(undefined)}
        >
          <ConnectedTarget
            playerAddress={defender.address}
            currentInput={currentInput}
            subscribeToInputConfirm={subscribeToInputConfirm}
          />
        </div>
      ))}
    </div>
  );
});
