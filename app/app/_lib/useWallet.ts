import { Address, Hex } from "viem";

import { USE_ANVIL } from "./constants";
import { useLocalWallet } from "./localWallet";
import { useMinionWalletOrRedirectToLogin } from "./minions";

export interface WalletLike {
  address: Address;
  send(callData: Hex): Promise<void>;
}

export const useWallet = USE_ANVIL
  ? useLocalWallet
  : useMinionWalletOrRedirectToLogin;
