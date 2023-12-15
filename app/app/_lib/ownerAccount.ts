import { useCallback } from "react";
import { Address } from "viem";
import {
  useAccount,
  useBalance,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from "wagmi";

export function useOwnerBalance(watch: boolean): bigint | undefined {
  const { address } = useAccount();
  const { data } = useBalance({ address, watch });
  return data?.value;
}

export interface UseSendEthOut {
  sendEth?(): void;
  isSendingEth: boolean;
}

export function useSendEth(
  to: Address | undefined,
  value: bigint,
): UseSendEthOut {
  const { config } = usePrepareSendTransaction({
    to,
    value,
  });
  const {
    data,
    sendTransaction,
    isLoading: isSending,
  } = useSendTransaction(config);
  const { isLoading: isWaiting } = useWaitForTransaction({ hash: data?.hash });
  const sendEth = useCallback(() => sendTransaction?.(), [sendTransaction]);
  return { sendEth, isSendingEth: isSending || isWaiting };
}
