"use client";
import { memo, ReactNode, useEffect } from "react";

import { WORD_LENGTH } from "../_lib/constants";

export interface KeyboardCaptureProps {
  value: string;
  onValueChange(value: string): void;
  onSubmit(): void;
}

export default memo(function KeyboardCapture({
  value,
  onValueChange,
  onSubmit,
}: KeyboardCaptureProps): ReactNode {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent): void {
      if (event.key === "Backspace") {
        onValueChange(value.slice(0, -1));
      } else if (event.key === "Enter" && value.length === WORD_LENGTH) {
        onSubmit();
      } else if (value.length < WORD_LENGTH && isLetter(event.key)) {
        onValueChange(value + event.key.toUpperCase());
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });
  return undefined;
});

function isLetter(s: string) {
  return s.match(/^[a-zA-Z]$/);
}
