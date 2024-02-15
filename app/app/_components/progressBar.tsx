import { memo, ReactNode } from "react";

export interface ProgressBarProps {
  fillFraction: number;
}

export default memo(function ProgressBar({
  fillFraction,
}: ProgressBarProps): ReactNode {
  const fillPercent = `${fillFraction * 100}%`;
  return (
    <div className="relative h-2 w-full rounded bg-white bg-opacity-30">
      <div
        className="absolute left-0 top-0 h-2 rounded bg-white bg-opacity-30"
        style={{ width: fillPercent }}
      />
    </div>
  );
});
