import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { Address } from "viem";
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useEstimateGas,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

export function useOwnerBalance(watch: boolean): bigint | undefined {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: balance, queryKey } = useBalance({ address });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [blockNumber, queryClient]);

  return balance?.value;
}

export interface UseSendEthOut {
  sendEth?(): void;
  isSendingEth: boolean;
}

export function useSendEth(
  to: Address | undefined,
  value: bigint,
): UseSendEthOut {
  // const { data: gas } = useEstimateGas({
  //   to,
  //   value,
  // });
  // const {
  //   sendTransaction,
  //   isPending: isSending,
  // } = useSendTransaction();
  // // const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: data?.hash });
  // const sendEth = useCallback(() => {
  //   if (to) {
  //     sendTransaction({ gas, to, value }, {
  //       onSuccess: (hash) =>
  //     })
  //   }
  // }, [sendTransaction, gas, to, value]);
  // return { sendEth, isSendingEth: isSending || isWaiting };
}
