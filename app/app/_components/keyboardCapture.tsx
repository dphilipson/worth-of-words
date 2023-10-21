"use client";
import { memo, ReactNode, useEffect } from "react";

export interface KeyboardCaptureProps {
  onKey(key: string): void;
}

export default memo(function KeyboardCapture({
  onKey,
}: KeyboardCaptureProps): ReactNode {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent): void {
      onKey(event.key);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onKey]);
  return undefined;
});
