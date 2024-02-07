import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { Hex } from "viem";

import { WORTH_OF_WORDS_ADDRESS } from "./constants";
import { useLocalStorage } from "./hooks";
import { useRedirectToLogin } from "./loginRedirects";
import {
  createOwnerAccount,
  createSessionKeyAccount,
  isDeployed,
  sendUserOperation,
} from "./modularAccount";
import { useTurnkeyDetails } from "./turnkey";
import { WalletLike } from "./useWallet";

const ACCOUNT_ADDRESS_KEY = "worth-of-words:wallet:account-address";
const SESSION_PRIVATE_KEY_KEY = "worth-of-words:wallet:session-private-key";

export function useAccountAddress() {
  return useLocalStorage({
    key: ACCOUNT_ADDRESS_KEY,
    fromJson: (s) => s as Hex,
  });
}

export function useSessionPrivateKey() {
  return useLocalStorage({
    key: SESSION_PRIVATE_KEY_KEY,
    fromJson: (s) => s as Hex,
  });
}

export function useSessionKeyWallet(): WalletLike | undefined {
  const { isSuccess, data: wallet, error } = useSessionKeyWalletQuery();
  const redirectToLogin = useRedirectToLogin();

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (isSuccess && !wallet) {
      redirectToLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, wallet]);

  return wallet ?? undefined;
}

function useSessionKeyWalletQuery(): UseQueryResult<WalletLike | null> {
  const [details] = useTurnkeyDetails();
  const [accountAddress] = useAccountAddress();
  const [sessionPrivateKey] = useSessionPrivateKey();
  const ownerAddress = details?.address;

  // useQuery fails if returning undefined.
  return useQuery<WalletLike | null>({
    queryKey: [
      "session-key-wallet",
      ownerAddress,
      accountAddress,
      sessionPrivateKey,
    ],
    queryFn: async () => {
      if (!ownerAddress || !accountAddress || !sessionPrivateKey) {
        return null;
      }
      const account = await createSessionKeyAccount({
        accountAddress,
        sessionPrivateKey,
      });
      const deployed = await isDeployed(accountAddress);
      if (!deployed) {
        return null;
      }
      return {
        address: accountAddress,
        send: (data) =>
          sendUserOperation({
            account,
            target: WORTH_OF_WORDS_ADDRESS,
            data,
          }),
      };
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}
