import { memo, ReactNode } from "react";

import { useNow } from "../_lib/hooks";
import ProgressBar from "./progressBar";

export interface TimedProgressBarProps {
  startTime: number;
  endTime: number;
}

export default memo(function TimedProgressBar({
  startTime,
  endTime,
}: TimedProgressBarProps): ReactNode {
  const now = useNow(true);
  const fillFraction = Math.max(
    0,
    Math.min(1, (now - startTime) / (endTime - startTime)),
  );

  return <ProgressBar fillFraction={fillFraction} />;
});
