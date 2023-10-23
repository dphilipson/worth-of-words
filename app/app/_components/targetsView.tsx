import { memo, ReactNode, useMemo } from "react";

import { getDefenders, Player } from "../_lib/gameLogic";
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
  const sortedDefenders = useMemo(() => {
    const defenders = getDefenders(lobby, playerAddress);
    defenders.sort(defenderComparator);
    return defenders;
  }, [lobby, playerAddress]);
  return (
    <div className="flex w-full justify-around">
      {sortedDefenders.map((defender, i) => {
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
            />
          </div>
        );
      })}
    </div>
  );
});

function defenderComparator(a: Player, b: Player): number {
  if (a.name !== b.name) {
    return a.name < b.name ? -1 : 1;
  }
  return a.address < b.address ? -1 : 1;
}
