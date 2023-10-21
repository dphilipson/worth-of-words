import { memo, ReactNode } from "react";

import { getDefenders } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";
import ConnectedGuessGrid from "./connectedGuessGrid";
import ConnectedPlayerListItem from "./connectedPlayerListItem";

export interface TargetsViewProps {
  currentInput: string;
}

export default memo(function TargetsView({
  currentInput,
}: TargetsViewProps): ReactNode {
  const { playerAddress, lobby } = useLobby();
  const defenders = getDefenders(lobby, playerAddress);
  return (
    <div className="flex w-full justify-around">
      {defenders.map((defender) => {
        return (
          <div
            key={defender.address}
            className="flex w-full max-w-xs flex-col items-center space-y-4"
          >
            <ConnectedPlayerListItem playerAddress={defender.address} />
            <ConnectedGuessGrid
              playerAddress={defender.address}
              currentInput={currentInput}
            />
          </div>
        );
      })}
    </div>
  );
});
