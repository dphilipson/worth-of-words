import { motion, PanInfo } from "framer-motion";
import { memo, ReactNode, useCallback } from "react";

import { Player } from "../_lib/gameLogic";
import { SubscribeFunction } from "../_lib/subscriptions";
import ConnectedTarget from "./connectedTarget";
import FadeInOnEnterBox from "./fadeInOnEnterBox";

/**
 * If the player grid is dragged for longer than this, then change to the next
 * target.
 */
const SWIPE_THRESHOLD_FRACTION_OF_SCREEN = 0.4;

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
  const numDefenders = defenders.length;
  const defenderIndex = rawDefenderIndex < numDefenders ? rawDefenderIndex : 0;
  const defender = defenders[defenderIndex];

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { x } = info.offset;
      if (
        Math.abs(x) >=
        SWIPE_THRESHOLD_FRACTION_OF_SCREEN * window.innerWidth
      ) {
        const nextIndex =
          (defenderIndex + Math.sign(x) + numDefenders) % numDefenders;
        setDefenderIndex(nextIndex);
      }
    },
    [defenderIndex, numDefenders, setDefenderIndex],
  );

  const targetInfoText = (() => {
    switch (numDefenders) {
      case 1:
        return "You have one opponent. Good luck!";
      case 2:
        return "You are targeting two opponents. Swipe left or right to view the other one!";
      case 3:
        return "You are targeting three opponents. Swipe left or right to view the others!";
      default:
        // Not needed for now, but we'll cover this case just in case it changes.
        return `You are targeting ${numDefenders} opponents! Swipe left or right to view the others.`;
    }
  })();

  return (
    <div>
      <div className="w-screen bg-black bg-opacity-40 px-4 py-1 text-center text-white">
        {targetInfoText}
      </div>
      <motion.div
        key={defender.address}
        className="mx-auto mt-4 h-full w-full max-w-xs cursor-pointer px-3"
        drag={numDefenders > 1 ? "x" : false}
        dragSnapToOrigin={true}
        onDragEnd={handleDragEnd}
      >
        <FadeInOnEnterBox fadeDuration={0.3}>
          <ConnectedTarget
            playerAddress={defender.address}
            currentInput={currentInput}
            subscribeToInputConfirm={subscribeToInputConfirm}
          />
        </FadeInOnEnterBox>
      </motion.div>
    </div>
  );
});
