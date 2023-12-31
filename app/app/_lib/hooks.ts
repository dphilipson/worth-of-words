import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

/**
 * Returns a ref whose `.current` value always contains the most recently
 * updated version of `value`. This is useful for passing to callbacks to ensure
 * that when the callback is called, the most recent value is used.
 */
export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function usePrintChanges<T>(x: T): void {
  const previous = usePrevious(x);
  if (previous !== x) {
    console.log("Change:", previous, x);
  }
}

/**
 * Initially undefined so we don't have NextJS preload the page with an empty hash
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

/**
 * Like `useMemo`, except that it's guaranteed to keep the same instance if the
 * dependencies don't change, unlike `useMemo` which is permitted to drop the
 * cached value as an optimization.
 */
export function useReallyMemo<T>(f: () => T, deps: unknown[]): T {
  const previousDeps = usePrevious(deps);
  const ref = useRef<T>();
  if (ref.current === undefined || arraysDiffer(previousDeps!, deps)) {
    ref.current = f();
  }
  return ref.current;
}

function arraysDiffer(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return true;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return true;
    }
  }
  return false;
}

export interface UseLocalStorageConfig<T> {
  key: string;
  disabled?: boolean;
  toJson?: (value: T) => unknown;
  fromJson?: (value: any) => T;
}

export function useLocalStorage<T>({
  key,
  toJson = identity,
  fromJson = identity,
}: UseLocalStorageConfig<T>): [
  value: T | undefined,
  setValue: (value: T | undefined) => void,
] {
  const loadFromStorage = () => {
    const json = localStorage.getItem(key);
    return json === null ? undefined : fromJson(JSON.parse(json));
  };
  const [value, setState] = useState(loadFromStorage);
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (hasMounted) {
      setState(loadFromStorage());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: T | undefined) => {
      if (value !== undefined) {
        localStorage.setItem(key, JSON.stringify(toJson(value)));
      } else {
        localStorage.removeItem(key);
      }
      setState(value);
    },
    [key, toJson],
  );

  return [value, setValue];
}

function identity<T>(x: T): T {
  return x;
}
