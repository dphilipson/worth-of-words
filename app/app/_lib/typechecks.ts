export function notNull<T>(x: T | undefined | null): T {
  if (x == null) {
    throw new Error("Unexpected absent value.");
  }
  return x;
}
