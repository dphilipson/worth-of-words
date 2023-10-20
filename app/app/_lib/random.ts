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
