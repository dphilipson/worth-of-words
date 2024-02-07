import { Address, Hex } from "viem";

import { USE_DEBUG_ACCOUNTS } from "./constants";
import { useLocalWallet } from "./localWallet";
import { useSessionKeyWallet } from "./sessionKeyWallet";

export interface WalletLike {
  address: Address;
  send(callData: Hex): Promise<void>;
}

export const useWallet: () => WalletLike | undefined = USE_DEBUG_ACCOUNTS
  ? useLocalWallet
  : useSessionKeyWallet;
