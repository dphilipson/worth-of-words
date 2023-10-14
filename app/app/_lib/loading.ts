export async function waitForGlobal<T>(key: string): Promise<T> {
  const value = (window as any)[key];
  if (value !== undefined) {
    return Promise.resolve(value);
  }
  return new Promise((resolve) =>
    Object.defineProperty(window, key, {
      configurable: true,
      set(x) {
        delete (window as any)[key];
        (window as any)[key] = x;
        resolve(x);
      },
    })
  );
}

export function newOneTimeLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let resolve: (out: T) => void;
  let reject: (error: unknown) => void;
  let isStarted = false;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return () => {
    if (!isStarted) {
      isStarted = true;
      load().then(resolve, reject);
    }
    return promise;
  };
}
