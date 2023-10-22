import { useRouter } from "next/navigation";
import { memo, ReactNode, useCallback, useEffect, useState } from "react";
import { Address, Hex, keccak256, parseEther } from "viem";
import { privateKeyToAddress } from "viem/accounts";
import { useSignMessage, useWaitForTransaction } from "wagmi";

import LoadingButton from "@/app/_components/loadingButton";
import {
  useMinionAccountFactoryCreateAccount,
  useMinionAccountFactoryHasDeployed,
} from "@/app/_generated/wagmi";
import {
  MINION_FACTORY_ADDRESS,
  PREFUND_VALUE,
  SECRET_GENERATING_MESSAGE,
} from "@/app/_lib/constants";
import { useUrlHash } from "@/app/_lib/hooks";

export interface AccountSetupWhenConnectedProps {
  address: Address;
}

export default memo(function AccountSetupWhenConnected({
  address,
}: AccountSetupWhenConnectedProps): ReactNode {
  const [secretKey, setSecretKey] = useState(loadSecretKey(address));

  const reallyStoreSecretKey = useCallback(
    (secretKey: Hex) => {
      setSecretKey(secretKey);
      storeSecretKey(address, secretKey);
    },
    [address],
  );

  const { data: factoryHasDeployed } = useMinionAccountFactoryHasDeployed({
    address: MINION_FACTORY_ADDRESS,
    args: [address],
  });

  const { signMessage, isLoading: isSigning } = useSignMessage({
    message: SECRET_GENERATING_MESSAGE,
    onSuccess: (signedMesage: Hex) =>
      reallyStoreSecretKey(keccak256(signedMesage)),
  });
  const onClickSign = useCallback(() => signMessage(), [signMessage]);

  const {
    data: createAccountOut,
    isLoading: creatingAccount,
    write,
  } = useMinionAccountFactoryCreateAccount({
    address: MINION_FACTORY_ADDRESS,
    value: parseEther(PREFUND_VALUE),
    // Needs args at calltime.
  });

  const { isLoading: waitingForTransaction, isSuccess: transactionSucceeded } =
    useWaitForTransaction({ hash: createAccountOut?.hash });

  const router = useRouter();
  const urlHash = useUrlHash();

  useEffect(() => {
    if (transactionSucceeded) {
      if (!urlHash) {
        router.push("/");
      } else {
        const redirectTarget = decodeURIComponent(urlHash);
        router.push("/" + redirectTarget);
      }
    }
  }, [transactionSucceeded, urlHash, router]);

  if (!secretKey) {
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
  } else if (factoryHasDeployed === undefined) {
    return <p>Checking if account exists</p>;
  } else if (!factoryHasDeployed) {
    const publicKey = privateKeyToAddress(secretKey);
    const createAccount = () => write({ args: [publicKey] });
    return (
      <>
        <h3>Last step! Deploy your account</h3>
        <p>Deploy and fund the account you will use to play Worth of Words.</p>
        <p>
          Funds sent to this account can only be used to pay for gas, and you
          may withdraw them at any time.
        </p>
        <div className="flex justify-end">
          <LoadingButton
            className="btn btn-primary"
            isLoading={creatingAccount || waitingForTransaction}
            onClick={createAccount}
          >
            Create account
          </LoadingButton>
        </div>
      </>
    );
  }
});

function storeSecretKey(address: Address, key: Hex): void {
  localStorage.setItem(getSecretKeyKey(address), key);
}

function loadSecretKey(address: Address): Hex | null {
  return localStorage.getItem(getSecretKeyKey(address)) as Hex | null;
}

function getSecretKeyKey(address: Address): string {
  return `secret-key:${address}`;
}
