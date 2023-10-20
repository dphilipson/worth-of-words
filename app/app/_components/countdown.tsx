import { memo, ReactNode, useEffect, useRef, useState } from "react";

export interface CountdownProps {
  deadline: number;
}

export const Countdown = memo(function Countdown({
  deadline,
}: CountdownProps): ReactNode {
  const [remainingTime, setRemainingTime] = useState(
    Math.max(0, deadline - Date.now()),
  );
  const timeoutId = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleRemainingTicks(): void {
      const remainingTime = Math.max(0, deadline - Date.now());
      if (remainingTime === 0) {
        return;
      }
      const timeToNextTick = (remainingTime % 1000) + 1;
      timeoutId.current = setTimeout(() => {
        setRemainingTime(Math.max(0, deadline - Date.now()));
        handleRemainingTicks();
      }, timeToNextTick);
    }

    handleRemainingTicks();
    return () => {
      if (timeoutId.current !== undefined) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [deadline]);

  return <span>{toMinuteSecondString(remainingTime)}</span>;
});

function toMinuteSecondString(ms: number): string {
  const totalSeconds = (ms / 1000) | 0;
  const minutes = (totalSeconds / 60) | 0;
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
