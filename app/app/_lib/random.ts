import { Hex } from "viem";

export function randomBytes32(): Hex {
  const ints = new Uint32Array(8);
  crypto.getRandomValues(ints);
  const hexDigits = [...ints]
    .map((n) => n.toString(16).padStart(8, "0"))
    .join("");
  return `0x${hexDigits}`;
}

export function randomUint256(): bigint {
  return BigInt(randomBytes32());
}

export function shuffledCopy<T>(xs: T[]): T[] {
  // Fisher-Yates
  xs = [...xs];
  for (let i = xs.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const temp = xs[i];
    xs[i] = xs[j];
    xs[j] = temp;
  }
  return xs;
}
