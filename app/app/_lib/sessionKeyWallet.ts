import { MultiOwnerModularAccount } from "@alchemy/aa-accounts";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { Hex } from "viem";
import { privateKeyToAddress } from "viem/accounts";

import {
  REFRESH_SESSION_KEY_AT_TTL,
  WORTH_OF_WORDS_ADDRESS,
} from "./constants";
import { useSetTimeout } from "./hooks";
import { useStorage } from "./localStorage";
import { useRedirectToLogin } from "./loginRedirects";
import {
  canSessionKeyAccessGame,
  createSessionKeyAccount,
  getSessionKeyExpiryTime,
  isDeployed,
  sendUserOperation,
} from "./modularAccount";
import { WalletLike } from "./useWallet";

const OWNER_ADDRESS_KEY = "worth-of-words:wallet:owner-address";
const ACCOUNT_ADDRESS_KEY = "worth-of-words:wallet:account-address";
const SESSION_PRIVATE_KEY_KEY = "worth-of-words:wallet:session-private-key";

export function useOwnerAddress() {
  return useStorage({
    key: OWNER_ADDRESS_KEY,
    fromJson: (s) => s as Hex,
  });
}

export function useAccountAddress() {
  return useStorage({
    key: ACCOUNT_ADDRESS_KEY,
    fromJson: (s) => s as Hex,
  });
}

export function useSessionPrivateKey() {
  return useStorage({
    key: SESSION_PRIVATE_KEY_KEY,
    fromJson: (s) => s as Hex,
  });
}

export function useLogOut(): () => void {
  const [, setOwnerAddress] = useOwnerAddress();
  const [, setAccountAddress] = useAccountAddress();
  const [, setSessionPrivateKey] = useSessionPrivateKey();

  return useCallback(() => {
    setOwnerAddress(undefined);
    setAccountAddress(undefined);
    setSessionPrivateKey(undefined);
    window.location.href = "/";
  }, [setOwnerAddress, setAccountAddress, setSessionPrivateKey]);
}

export function useSessionKeyWallet(): WalletLike | undefined {
  const { isSuccess, data } = useSessionKeyWalletQuery();
  const [, setSessionPrivateKey] = useSessionPrivateKey();
  const redirectToLogin = useRedirectToLogin();
  const setTimeout = useSetTimeout();

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    if (!data) {
      setSessionPrivateKey(undefined);
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
  const [ownerAddress] = useOwnerAddress();
  const [accountAddress] = useAccountAddress();
  const [sessionPrivateKey] = useSessionPrivateKey();

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
      let promiseResults: [number, boolean, MultiOwnerModularAccount, boolean];
      try {
        promiseResults = await Promise.all([
          getSessionKeyExpiryTime({ accountAddress, sessionPublicKey }),
          canSessionKeyAccessGame({ accountAddress, sessionPublicKey }),
          createSessionKeyAccount({ accountAddress, sessionPrivateKey }),
          isDeployed(accountAddress),
        ]);
      } catch (error) {
        if (isInvalidSessionKeyError(error)) {
          // The session key does not exist. That most likely means either the
          // user deleted it or we have switched to a different set of
          // contracts, e.g. because we upgraded or switched to a new chain.
          return null;
        }
        throw error;
      }
      const [exactExpiryTime, canAccessGame, account, deployed] =
        promiseResults;
      const expiryTime = exactExpiryTime - REFRESH_SESSION_KEY_AT_TTL;
      if (!deployed || !canAccessGame || expiryTime < Date.now()) {
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

function isInvalidSessionKeyError(error: any): boolean {
  // I sure hope this doesn't change in future Viem versions.
  return (
    error?.name === "ContractFunctionExecutionError" &&
    error?.cause?.data?.errorName === "InvalidSessionKey"
  );
}
