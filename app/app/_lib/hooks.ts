import { useEffect, useRef } from "react";

export function useSetDeadline(): (
  fn: () => void,
  deadline: number,
) => () => void {
  const setTimeout = useSetTimeout();
  return (fn, deadline) => setTimeout(fn, Math.max(0, deadline - Date.now()));
}

/**
 * Returns a function that's like `setTimeout`, except that it's automatically
 * cancelled if the component unmounts and it returns a cancellation function
 * instead of a timeout id.
 */
function useSetTimeout(): (fn: () => void, delay: number) => () => void {
  const timeoutIds = useRef(new Set<NodeJS.Timeout>()).current;

  useEffect(() => () => {
    for (const timeoutId of timeoutIds) {
      clearTimeout(timeoutId);
    }
  });

  return (fn, delay) => {
    const timeoutId = setTimeout(() => {
      timeoutIds.delete(timeoutId);
      fn();
    }, delay);
    timeoutIds.add(timeoutId);
    return () => {
      clearTimeout(timeoutId);
      timeoutIds.delete(timeoutId);
    };
  };
}

export function usePrevious<T>(x: T): T | undefined {
  const previousRef = useRef<T>();
  const previous = previousRef.current;
  previousRef.current = x;
  return previous;
}

export function usePrintChanges<T>(x: T): void {
  const previous = usePrevious(x);
  if (previous !== x) {
    console.log("Change:", previous, x);
  }
}
