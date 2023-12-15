import { useEffect, useRef } from "react";

import { useLatestRef } from "./hooks";

export type Subscription<T, R = void> = [
  PublishFunction<T, R>,
  SubscribeFunction<T, R>,
];

export type PublishFunction<T, R = void> = T extends void
  ? () => R[]
  : (event: T) => R[];

export type SubscribeFunction<T, R = void> = (
  callback: (event: T) => R,
) => UnsubscribeFunction;
export type UnsubscribeFunction = () => void;

/**
 * Produces a pair of functions, subscribe() and publish(), which can be used to
 * establish a pub/sub relationship. Subscribers can call subscribe() and pass
 * in a callback, while publishers can call publish() to trigger all such
 * callbacks. The publisher receives an array of the results output by each
 * subscriber in response to the event.
 *
 * This is useful for enabling parent components to "call" functions on child
 * components without using imperative handles, which are verbose, complex, and
 * not TypeScript friendly.
 */
export function createSubscription<T, R = void>(): Subscription<T, R> {
  const callbacks: Set<(event: T) => R> = new Set();
  const subscribe: SubscribeFunction<T, R> = (callback) => {
    callbacks.add(callback);
    return () => callbacks.delete(callback);
  };
  const publish = (event: T): R[] =>
    Array.from(callbacks).map((callback) => callback(event));
  return [publish as any, subscribe];
}

export function useCreateSubscription<T, R = void>(): Subscription<T, R> {
  return useRef(createSubscription<T, R>()).current;
}

export function useSubscribe<T, R = void>(
  subscribe: SubscribeFunction<T, R> | undefined,
  callback: (event: T) => R,
): void {
  const latestCallback = useLatestRef(callback);
  useEffect(() => {
    if (subscribe) {
      return subscribe((event) => latestCallback.current(event));
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);
}
