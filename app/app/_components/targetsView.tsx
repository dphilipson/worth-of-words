import { memo, ReactNode } from "react";

import { getDefenders } from "../_lib/gameLogic";
import { useLobby } from "../_lib/useLobby";
import ConnectedGuessGrid from "./connectedGuessGrid";
import ConnectedPlayerListItem from "./connectedPlayerListItem";

export interface TargetsViewProps {
  currentInput: string;
  onHoverChange(index: number | undefined): void;
}

export default memo(function TargetsView({
  currentInput,
  onHoverChange,
}: TargetsViewProps): ReactNode {
  const { playerAddress, lobby } = useLobby();
  const defenders = getDefenders(lobby, playerAddress);
  return (
    <div className="flex w-full justify-around">
      {defenders.map((defender, i) => {
        return (
          <div
            key={defender.address}
            className="flex w-full max-w-xs flex-col items-center space-y-4"
            onMouseEnter={() => onHoverChange(i)}
            onMouseLeave={() => onHoverChange(undefined)}
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
