import Link from "next/link";
import { memo, ReactNode, useCallback } from "react";
import { encodeFunctionData, parseEther } from "viem/utils";
import { useBalance, useMutation } from "wagmi";

import { minionAccountABI } from "../_generated/wagmi";
import { REFILL_VALUE } from "../_lib/constants";
import { useOwnerBalance, useSendEth } from "../_lib/ownerAccount";
import { useWallet } from "../_lib/useWallet";
import LoadingButton from "./loadingButton";
import PolygonscanLink from "./polygonscanLink";

const UINT256_MAX = (BigInt(1) << BigInt(256)) - BigInt(1);

export interface AccountViewProps {
  isOpen: boolean;
  closeModal(): void;
}

export default memo(function AccountView({
  isOpen,
  closeModal,
}: AccountViewProps): ReactNode {
  const wallet = useWallet(false);
  const { data: balanceResult } = useBalance({
    address: wallet?.address,
    watch: isOpen,
  });
  const balanceText = balanceResult
    ? formatBalance(balanceResult.value)
    : "(loading)";
  const hasNoFunds = balanceResult?.value === BigInt(0);
  const refillNumber = parseEther(REFILL_VALUE);
  const ownerBalance = useOwnerBalance(isOpen);
  const ownerBalanceTooLow =
    ownerBalance !== undefined && ownerBalance < refillNumber;

  const { sendEth, isSendingEth } = useSendEth(wallet?.address, refillNumber);

  const { mutate: mutateWithdraw, isLoading: isWithdrawing } = useMutation({
    mutationFn: async () =>
      wallet?.send(
        encodeFunctionData({
          abi: minionAccountABI,
          functionName: "withdraw",
          args: [UINT256_MAX],
        }),
      ),
  });

  const withdraw = useCallback(() => mutateWithdraw(), [mutateWithdraw]);

  if (!wallet) {
    return (
      <div className="prose text-center">
        <h3>Account</h3>
        <p>
          Worth of Words account not connected.{" "}
          <Link href="/about#minion-accounts" onClick={closeModal}>
            What is this?
          </Link>
        </p>
        <Link className="btn btn-primary" href="/account" onClick={closeModal}>
          Connect account
        </Link>
      </div>
    );
  }

  return (
    <div className="prose">
      <h3>Account</h3>
      <p>
        This is your Worth of Words account. Its funds are only used to pay for
        gas and can be withdrawn to your main account at any time.{" "}
        <Link href="/about#minion-accounts" onClick={closeModal}>
          Why does this exist?
        </Link>
      </p>
      <p>
        Address: <PolygonscanLink address={wallet.address} />
        <br />
        Balance: {balanceText}
      </p>
      <h4>Add Funds</h4>
      <p>
        Need more funds? Get some from the{" "}
        <Link href="https://mumbaifaucet.com">Mumbai faucet</Link>. You can
        enter the above address directly into the faucet.
      </p>
      <LoadingButton
        className="btn btn-primary btn-sm"
        disabled={ownerBalanceTooLow}
        isLoading={isSendingEth}
        onClick={sendEth}
      >
        {isSendingEth
          ? "Adding MATIC…"
          : ownerBalanceTooLow
          ? `Need ${REFILL_VALUE} MATIC`
          : `Add ${REFILL_VALUE} MATIC`}
      </LoadingButton>
      <h4>Withdraw funds</h4>
      <p className="text-orange-500">
        This will withdraw all funds from the account. If you are currently in
        any games, you will not be able to pay for gas to finish them.
      </p>
      <LoadingButton
        className="btn btn-primary btn-sm"
        disabled={isWithdrawing || hasNoFunds}
        isLoading={isWithdrawing}
        onClick={withdraw}
      >
        {isWithdrawing
          ? "Withdrawing…"
          : hasNoFunds
          ? "Empty balance"
          : "Withdraw all funds"}
      </LoadingButton>
    </div>
  );
});

/**
 * Formats to two decimal points.
 */
function formatBalance(wei: bigint): string {
  const quantity = (Number(wei / BigInt(1e16)) / 100).toFixed(2);
  return `${quantity} MATIC (Mumbai testnet)`;
}
