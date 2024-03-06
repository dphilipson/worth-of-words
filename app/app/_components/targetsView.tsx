import { memo, ReactNode, useMemo } from "react";

import { getSortedDefenders } from "../_lib/gameLogic";
import { useIsLargeWindow } from "../_lib/hooks";
import { SubscribeFunction } from "../_lib/subscriptions";
import { useLobby } from "../_lib/useLobby";
import DesktopTargetsView from "./desktopTargetsView";
import MobileTargetsView from "./mobileTargetsView";

export interface TargetsViewProps {
  currentInput: string;
  selectedMobileIndex: number;
  setSelectedMobileIndex(index: number): void;
  onHoverChange(index: number | undefined): void;
  subscribeToInputConfirm: SubscribeFunction<void>;
}

export default memo(function TargetsView({
  currentInput,
  selectedMobileIndex,
  setSelectedMobileIndex,
  onHoverChange,
  subscribeToInputConfirm,
}: TargetsViewProps): ReactNode {
  const { playerAddress, lobby } = useLobby();
  const defenders = useMemo(
    () => getSortedDefenders(lobby, playerAddress),
    [lobby, playerAddress],
  );
  const isLargeWindow = useIsLargeWindow();
  if (isLargeWindow === undefined) {
    return undefined;
  } else if (isLargeWindow) {
    return (
      <DesktopTargetsView
        defenders={defenders}
        currentInput={currentInput}
        onHoverChange={onHoverChange}
        subscribeToInputConfirm={subscribeToInputConfirm}
      />
    );
  } else {
    return (
      <MobileTargetsView
        defenders={defenders}
        defenderIndex={selectedMobileIndex}
        currentInput={currentInput}
        subscribeToInputConfirm={subscribeToInputConfirm}
        setDefenderIndex={setSelectedMobileIndex}
      />
    );
  }
});
