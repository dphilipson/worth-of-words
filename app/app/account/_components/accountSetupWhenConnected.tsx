import { useRouter } from "next/navigation";
import { memo, ReactNode, useCallback, useEffect, useState } from "react";
import { Address, Hex, keccak256, parseEther, zeroAddress } from "viem";
import { privateKeyToAddress } from "viem/accounts";
import { useSignMessage, useWaitForTransaction } from "wagmi";

import LoadingButton from "@/app/_components/loadingButton";
import {
  useMinionAccountFactoryCreateAccount,
  useMinionAccountFactoryGetAddressIfDeployed,
} from "@/app/_generated/wagmi";
import {
  MINION_FACTORY_ADDRESS,
  PREFUND_VALUE,
  SECRET_GENERATING_MESSAGE,
} from "@/app/_lib/constants";
import { useUrlHash } from "@/app/_lib/hooks";
import {
  loadMinionPrivateKey,
  storeMinionPrivateKey,
} from "@/app/_lib/minions";
import { useOwnerBalance } from "@/app/_lib/ownerAccount";

export interface AccountSetupWhenConnectedProps {
  address: Address;
}

export default memo(function AccountSetupWhenConnected({
  address,
}: AccountSetupWhenConnectedProps): ReactNode {
  const ownerBalance = useOwnerBalance(true);
  const [privateKey, setPrivateKey] = useState(loadMinionPrivateKey(address));

  const reallyStorePrivateKey = useCallback(
    (privateKey: Hex) => {
      setPrivateKey(privateKey);
      storeMinionPrivateKey(address, privateKey);
    },
    [address],
  );

  const { data: deployedAddress } = useMinionAccountFactoryGetAddressIfDeployed(
    {
      address: MINION_FACTORY_ADDRESS,
      args: [address],
    },
  );
  const hasDeployed =
    deployedAddress === undefined ? undefined : deployedAddress !== zeroAddress;

  const { signMessage, isLoading: isSigning } = useSignMessage({
    message: SECRET_GENERATING_MESSAGE,
    onSuccess: (signedMesage: Hex) =>
      reallyStorePrivateKey(keccak256(signedMesage)),
  });
  const onClickSign = useCallback(() => signMessage(), [signMessage]);
  const prefundNumber = parseEther(PREFUND_VALUE);
  const {
    data: createAccountOut,
    isLoading: creatingAccount,
    write,
  } = useMinionAccountFactoryCreateAccount({
    address: MINION_FACTORY_ADDRESS,
    value: prefundNumber,
  });

  const { isLoading: waitingForTransaction, isSuccess: transactionSucceeded } =
    useWaitForTransaction({ hash: createAccountOut?.hash });

  const router = useRouter();
  const urlHash = useUrlHash();

  const isAllReady =
    (privateKey !== undefined && hasDeployed) || transactionSucceeded;
  const ownerBalanceTooLow =
    ownerBalance !== undefined && ownerBalance < prefundNumber;

  useEffect(() => {
    if (urlHash === undefined) {
      return;
    }
    if (isAllReady) {
      if (!urlHash) {
        router.replace("/");
        return;
      }
      const params = new URLSearchParams(urlHash);
      const redirect = params.get("redirect");
      if (redirect?.startsWith("/")) {
        router.replace(redirect);
      } else {
        router.replace("/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllReady, urlHash]);

  if (!privateKey) {
    return (
      <>
        <h3>Time to generate your secret</h3>
        <p>Sign a message to generate your Worth of Words secret key!</p>
        <div className="flex justify-end">
          <LoadingButton
            className="btn btn-primary"
            isLoading={isSigning}
            onClick={onClickSign}
          >
            Generate secret
          </LoadingButton>
        </div>
      </>
    );
  } else if (hasDeployed === undefined) {
    return <p>Checking if account exists</p>;
  } else if (!hasDeployed) {
    const publicKey = privateKeyToAddress(privateKey);
    const createAccount = () => write({ args: [publicKey] });
    const isLoading = creatingAccount || waitingForTransaction;
    return (
      <>
        <h3>Last step! Deploy your account!</h3>
        <p>Deploy and fund the account you will use to play Worth of Words.</p>
        <p>
          Funds sent to this account can only be used to pay for gas, and you
          may withdraw them at any time.
        </p>
        <p>
          You must have 0.19 MATIC on the Mumbai testnet for this step. To get
          some, visit the <a href="http://mumbaifaucet.com">Mumbai faucet</a>.
        </p>
        <div className="flex justify-center">
          <LoadingButton
            className="btn btn-primary"
            disabled={ownerBalanceTooLow}
            isLoading={isLoading}
            onClick={createAccount}
          >
            {isLoading
              ? "Creating account…"
              : ownerBalanceTooLow
              ? "Not enough MATIC"
              : "Create account"}
          </LoadingButton>
        </div>
      </>
    );
  } else {
    return <p>Logged in! Redirecting…</p>;
  }
});
