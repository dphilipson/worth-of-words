import { useCallback, useEffect, useState } from "react";

export interface UseStorageConfig<T> {
  key: string;
  toJson?: (value: T) => unknown;
  fromJson?: (value: any) => T;
  storageType?: "local" | "session";
}

// We won't feel bad about using a global variable to track callbacks since `localStorage` and
// `sessionStorage` are inherently global.
const valueChangeCallbacks = new Map<string, Set<(value: unknown) => void>>();

/**
 * Returns a value and a setter, similar to `useState`, except that the value is
 * also stored in either `localStorage` or `sessionStorage` and will update if
 * the same key is updated from any other instance of this hook.
 */
export function useStorage<T>({
  key,
  toJson = identity,
  fromJson = identity,
  storageType = "local",
}: UseStorageConfig<T>): [
  value: T | undefined,
  setValue: (value: T | undefined) => void,
] {
  const loadFromStorage = () => {
    const storage = getStorage(storageType);
    const json = storage?.getItem(key);
    return json == null ? undefined : fromJson(JSON.parse(json));
  };
  const [value, setState] = useState(loadFromStorage);
  const multisetKey = `${storageType}:${key}`;

  const setValue = useCallback(
    (value: T | undefined) => {
      const storage = getStorage(storageType);
      if (!storage) {
        return;
      }
      if (value !== undefined) {
        storage.setItem(key, JSON.stringify(toJson(value)));
      } else {
        storage.removeItem(key);
      }
      for (const onChange of valueChangeCallbacks.get(multisetKey) ?? []) {
        onChange(value);
      }
    },
    [key, toJson, storageType, multisetKey],
  );

  useEffect(() => {
    addMultisetEntry(valueChangeCallbacks, multisetKey, setState);
    return () => {
      removeMultisetEntry(valueChangeCallbacks, multisetKey, setState);
    };
  }, [multisetKey]);

  return [value, setValue];
}

/**
 * Returns undefined if storage does not exist as a global variable, which probably means we're in NextJS's server-side rendering.
 */
function getStorage(type: "local" | "session"): Storage | undefined {
  if (type === "local") {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } else {
    return typeof sessionStorage === "undefined" ? undefined : sessionStorage;
  }
}

function computeIfAbsent<K, V>(
  map: Map<K, V>,
  key: K,
  createValue: () => V,
): V {
  const oldValue = map.get(key);
  if (oldValue !== undefined) {
    return oldValue;
  }
  const value = createValue();
  map.set(key, value);
  return value;
}

function addMultisetEntry<K, V>(
  multiset: Map<K, Set<V>>,
  key: K,
  value: V,
): void {
  computeIfAbsent(multiset, key, () => new Set()).add(value);
}

function removeMultisetEntry<K, V>(
  multiset: Map<K, Set<V>>,
  key: K,
  value: V,
): void {
  const set = multiset.get(key);
  if (set === undefined) {
    return;
  }
  set.delete(value);
  if (set.size === 0) {
    multiset.delete(key);
  }
}

function identity<T>(x: T): T {
  return x;
}
