import { memo, ReactNode } from "react";
import { Address } from "viem";

import { SubscribeFunction } from "../_lib/subscriptions";
import ConnectedGuessGrid from "./connectedGuessGrid";
import ConnectedPlayerListItem from "./connectedPlayerListItem";

export interface ConnectedTargetProps {
  playerAddress: Address;
  currentInput: string;
  subscribeToInputConfirm: SubscribeFunction<void>;
}

export default memo(function ConnectedTarget({
  playerAddress,
  currentInput,
  subscribeToInputConfirm,
}: ConnectedTargetProps): ReactNode {
  return (
    <div className="flex flex-col items-center space-y-4">
      <ConnectedPlayerListItem playerAddress={playerAddress} />
      <ConnectedGuessGrid
        playerAddress={playerAddress}
        currentInput={currentInput}
        isSelfGrid={false}
        subscribeToInputConfirm={subscribeToInputConfirm}
      />
    </div>
  );
});
