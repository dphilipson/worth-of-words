import { Address, Hex } from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";

import { randomBytes32 } from "./random";

export interface LobbyKeypair {
  privateKey: Hex;
  publicKey: Address;
}

export function createLobbyKeypair(): LobbyKeypair {
  const privateKey = randomBytes32();
  const publicKey = privateKeyToAddress(privateKey);
  return { privateKey, publicKey };
}

export function getLobbyPassword(
  privateKey: Hex,
  player: Address,
): Promise<Hex> {
  const account = privateKeyToAccount(privateKey);
  return account.signMessage({ message: { raw: player } });
}
