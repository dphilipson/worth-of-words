import { useEffect, useRef, useState } from "react";

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

/**
 * Initially undefined we don't have NextJS preload the page with an empty hash
 * or some nonsense like that.
 */
export function useUrlHash(): string | undefined {
  const [hash, setHash] = useState<string>();
  useEffect(() => {
    setHash(window.location.hash.slice(1));
    const handleHashChange = () => {
      setHash(window.location.hash.slice(1));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  return hash;
}

/**
 * Returns true after the first render. Used as a hack to hide elements from SSR
 * if it doesn't make sense to render them into the page (e.g. if they look very
 * different depending on client-side state).
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}
