import {
  AlchemyProvider,
  withAlchemyGasFeeEstimator,
} from "@alchemy/aa-alchemy";
import {
  BaseSmartAccountParams,
  BaseSmartContractAccount,
} from "@alchemy/aa-core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Address,
  concatHex,
  encodeFunctionData,
  FallbackTransport,
  Hex,
  hexToBytes,
  PrivateKeyAccount,
  Transport,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useAccount } from "wagmi";

import {
  minionAccountFactoryABI,
  useMinionAccountFactoryGetAddressIfDeployed,
} from "../_generated/wagmi";
import {
  ALCHEMY_API_KEY,
  CHAIN,
  ENTRY_POINT_ADDRESS,
  FEE_BUFFER_PERCENT,
  MINION_FACTORY_ADDRESS,
  WORTH_OF_WORDS_ADDRESS,
} from "./constants";
import { WalletLike } from "./useWallet";

export function useMinionWallet(
  redirectToLogin: boolean,
): WalletLike | undefined {
  const { wallet, isLoading } = useLoadingMinionWallet();
  const router = useRouter();

  useEffect(() => {
    if (redirectToLogin && !wallet && !isLoading) {
      const redirect = location.href.replace(location.origin, "");
      const params = new URLSearchParams([["redirect", redirect]]);
      const target = "/account#?" + params;
      router.replace(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, isLoading, redirectToLogin]);

  return wallet;
}

interface LoadingWallet {
  wallet: WalletLike | undefined;
  isLoading: boolean;
}

function useLoadingMinionWallet(): LoadingWallet {
  // To get a minion account, we need:
  // - ConnectKit is connected
  // - Private key is in storage
  // - Account contract is deployed.
  const [loadingWallet, setLoadingWallet] = useState<LoadingWallet>({
    wallet: undefined,
    isLoading: true,
  });
  const { address: ownerAddress } = useAccount();
  const privateKey = ownerAddress && loadMinionPrivateKey(ownerAddress);
  const { data: deployedAddress } = useMinionAccountFactoryGetAddressIfDeployed(
    {
      address: MINION_FACTORY_ADDRESS,
      args: [ownerAddress!],
      enabled: !!ownerAddress,
      staleTime: Number.POSITIVE_INFINITY,
    },
  );
  useEffect(() => {
    if (!ownerAddress || !privateKey || deployedAddress === zeroAddress) {
      setLoadingWallet({ wallet: undefined, isLoading: false });
    } else if (deployedAddress === undefined) {
      setLoadingWallet({ wallet: undefined, isLoading: true });
    } else {
      const wallet = newMinionWallet(deployedAddress, privateKey);
      setLoadingWallet({ wallet, isLoading: false });
    }
  }, [ownerAddress, privateKey, deployedAddress]);
  return loadingWallet;
}

export function storeMinionPrivateKey(address: Address, key: Hex): void {
  localStorage.setItem(getPrivateKeyKey(address), key);
}

export function loadMinionPrivateKey(address: Address): Hex | undefined {
  return (localStorage.getItem(getPrivateKeyKey(address)) ?? undefined) as
    | Hex
    | undefined;
}

function getPrivateKeyKey(address: Address): string {
  return `worth-of-words:private-key:${address}`;
}

function newMinionWallet(accountAddress: Address, privateKey: Hex): WalletLike {
  const provider = withAlchemyGasFeeEstimator(
    new AlchemyProvider({
      apiKey: ALCHEMY_API_KEY,
      chain: CHAIN,
      entryPointAddress: ENTRY_POINT_ADDRESS,
    }),
    FEE_BUFFER_PERCENT,
    FEE_BUFFER_PERCENT,
  )
    // Increase the call gas limit to account for cases where actual gas is a
    // a bit more than estimated from being "front-run." For example, the last
    // player to reveal matches also triggers the advance to the next round,
    // which costs more gas.
    //
    // A factor of 2 is much higher than needed, but since this doesn't increase
    // the amount of gas spent and the user is never prompted to approve this
    // spend, it doesn't actually matter.
    .withCustomMiddleware(async (struct) => {
      return {
        ...struct,
        callGasLimit: BigInt((await struct.callGasLimit)!) * BigInt(2),
      };
    })
    .connect(
      (rpcClient) =>
        new MinionSmartContractAccount({
          accountAddress,
          entryPointAddress: ENTRY_POINT_ADDRESS,
          chain: rpcClient.chain,
          privateKey,
          factoryAddress: MINION_FACTORY_ADDRESS,
          rpcClient,
        }),
    );
  return {
    address: accountAddress,
    send: async (data) => {
      const out = await provider.sendUserOperation({
        target: WORTH_OF_WORDS_ADDRESS,
        value: BigInt(0),
        data,
      });
      await provider.waitForUserOperationTransaction(out.hash);
    },
  };
}

export interface MinionSmartAccountParams<
  TTransport extends Transport | FallbackTransport = Transport,
> extends BaseSmartAccountParams<TTransport> {
  privateKey: Hex;
}

/**
 * Implementation of a minion account for use in aa-sdk.
 */
export class MinionSmartContractAccount<
  TTransport extends Transport | FallbackTransport = Transport,
> extends BaseSmartContractAccount<TTransport> {
  private readonly privateKeyAccount: PrivateKeyAccount;

  constructor({
    privateKey,
    ...baseParams
  }: MinionSmartAccountParams<TTransport>) {
    super(baseParams);
    this.privateKeyAccount = privateKeyToAccount(privateKey);
  }

  public override getDummySignature(): `0x${string}` {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
  }

  public override encodeExecute(
    target: string,
    value: bigint,
    data: string,
  ): Promise<Hex> {
    // TODO: Expose withdrawals.
    if (target !== WORTH_OF_WORDS_ADDRESS) {
      throw new Error("Minions can only call Worth of Words.");
    }
    if (value !== BigInt(0)) {
      throw new Error("Minions cannot send ETH.");
    }
    return Promise.resolve(data as Hex);
  }

  public override signMessage(
    msg: string | Uint8Array,
  ): Promise<`0x${string}`> {
    if (typeof msg === "string" && msg.startsWith("0x")) {
      msg = hexToBytes(msg as Hex);
    } else if (typeof msg === "string") {
      msg = new TextEncoder().encode(msg);
    }
    return Promise.resolve(
      this.privateKeyAccount.signMessage({ message: { raw: msg } }),
    );
  }

  protected getAccountInitCode(): Promise<`0x${string}`> {
    return Promise.resolve(
      concatHex([
        MINION_FACTORY_ADDRESS,
        encodeFunctionData({
          abi: minionAccountFactoryABI,
          functionName: "createAccount",
          args: [this.privateKeyAccount.address],
        }),
      ]),
    );
  }
}
