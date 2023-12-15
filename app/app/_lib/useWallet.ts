import { Address, Hex } from "viem";

import { USE_ANVIL } from "./constants";
import { useLocalWallet } from "./localWallet";
import { useMinionWallet } from "./minions";

export interface WalletLike {
  address: Address;
  send(callData: Hex): Promise<void>;
}

export const useWallet: (redirectToLogin: boolean) => WalletLike | undefined =
  USE_ANVIL ? useLocalWallet : useMinionWallet;
