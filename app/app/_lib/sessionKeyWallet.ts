import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { Hex } from "viem";
import { privateKeyToAddress } from "viem/accounts";

import {
  REFRESH_SESSION_KEY_AT_TTL,
  WORTH_OF_WORDS_ADDRESS,
} from "./constants";
import { useLocalStorage, useSetTimeout } from "./hooks";
import { useRedirectToLogin } from "./loginRedirects";
import {
  createSessionKeyAccount,
  getSessionKeyExpiryTime,
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
  const { isSuccess, data, error } = useSessionKeyWalletQuery();
  const [, setSessionPrivateKey] = useSessionPrivateKey();
  const redirectToLogin = useRedirectToLogin();
  const setTimeout = useSetTimeout();

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    if (!data) {
      redirectToLogin();
      return;
    }
    const { expiryTime } = data;
    // Did you know `setTimeout` executes the callback immediately if the wait
    // time is at least 2^31 (or ~25 days)? Ask me how I know.
    const ttl = Math.max(Date.now() - expiryTime, 1 << 30);
    return setTimeout(() => {
      setSessionPrivateKey(undefined);
      redirectToLogin();
    }, ttl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data]);

  return data?.wallet ?? undefined;
}

interface WalletQueryOut {
  wallet: WalletLike;
  expiryTime: number;
}

function useSessionKeyWalletQuery(): UseQueryResult<WalletQueryOut | null> {
  const [details] = useTurnkeyDetails();
  const [accountAddress] = useAccountAddress();
  const [sessionPrivateKey] = useSessionPrivateKey();
  const ownerAddress = details?.address;

  // useQuery fails if returning undefined.
  return useQuery<WalletQueryOut | null>({
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
      const sessionPublicKey = privateKeyToAddress(sessionPrivateKey);
      const [exactExpiryTime, account, deployed] = await Promise.all([
        getSessionKeyExpiryTime({ accountAddress, sessionPublicKey }),
        createSessionKeyAccount({ accountAddress, sessionPrivateKey }),
        isDeployed(accountAddress),
      ]);
      if (!deployed) {
        return null;
      }
      const expiryTime = exactExpiryTime - REFRESH_SESSION_KEY_AT_TTL;
      if (expiryTime < Date.now()) {
        return null;
      }
      const wallet: WalletLike = {
        address: accountAddress,
        send: (data) =>
          sendUserOperation({
            account,
            target: WORTH_OF_WORDS_ADDRESS,
            data,
          }),
      };
      return { wallet, expiryTime };
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}
