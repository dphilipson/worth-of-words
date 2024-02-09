import {
  createMultiOwnerModularAccount,
  MultiOwnerModularAccount,
  MultiOwnerPlugin,
  SessionKeyPermissionsBuilder,
  SessionKeyPluginAbi,
  sessionKeyPluginActions,
} from "@alchemy/aa-accounts";
import { createAlchemySmartAccountClient } from "@alchemy/aa-alchemy";
import {
  Address,
  createSmartAccountClient,
  getVersion060EntryPoint,
  Hex,
  LocalAccountSigner,
  SmartAccountSigner,
  SmartContractAccount,
} from "@alchemy/aa-core";
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  getContract,
  http,
  keccak256,
  Transport,
} from "viem";
import { privateKeyToAddress } from "viem/accounts";
import { foundry } from "viem/chains";

import { iSessionKeyAccountAbi } from "../_generated/wagmi";
import {
  CHAIN,
  ENTRY_POINT_ADDRESS,
  MSCA_FACTORY_ADDRESS,
  MULTI_OWNER_PLUGIN_ADDRESS,
  PAYMASTER_ADDRESS,
  SESSION_KEY_PLUGIN_ADDRESS,
  SESSION_KEY_TTL,
  USE_ANVIL,
  WORTH_OF_WORDS_ADDRESS,
  WORTH_OF_WORDS_API_URL,
} from "./constants";

export const getSmartAccountClient = memoized(() => {
  const client = USE_ANVIL ? getLocalDevClient() : getAlchemyClient();
  return client.extend(sessionKeyPluginActions);
});

function getLocalDevClient() {
  return createSmartAccountClient({
    chain: CHAIN,
    transport: getTransport(),
    paymasterAndData: {
      dummyPaymasterAndData: () => PAYMASTER_ADDRESS,
      paymasterAndData: async (op) => {
        op.paymasterAndData = PAYMASTER_ADDRESS;
        return op;
      },
    },
  });
}

function getAlchemyClient() {
  return createAlchemySmartAccountClient({
    chain: CHAIN,
    rpcUrl: `${WORTH_OF_WORDS_API_URL}/rpc`,
    // Policy ID is filled in by the backend.
    gasManagerConfig: { policyId: "<redacted>" },
  });
}

export function createOwnerAccount(
  owner: SmartAccountSigner,
  accountAddress?: Address,
): Promise<MultiOwnerModularAccount<SmartAccountSigner>> {
  return createMultiOwnerModularAccount({
    transport: getTransport(),
    chain: CHAIN,
    owner,
    accountAddress,
    entryPoint: getVersion060EntryPoint(CHAIN, ENTRY_POINT_ADDRESS),
    factoryAddress: MSCA_FACTORY_ADDRESS,
  });
}

type Tx = {
  target: Address;
  value?: bigint;
  data: Hex | "0x";
};

export interface CreateSessionKeyAccountParams {
  accountAddress: Address;
  sessionPrivateKey: Hex;
}

export async function createSessionKeyAccount({
  accountAddress,
  sessionPrivateKey,
}: CreateSessionKeyAccountParams): Promise<
  MultiOwnerModularAccount<SmartAccountSigner>
> {
  const signer =
    LocalAccountSigner.privateKeyToAccountSigner(sessionPrivateKey);
  const sessionPublicKey = privateKeyToAddress(sessionPrivateKey);

  const encodeBatchExecute = async (txs: Tx[]) =>
    encodeFunctionData({
      abi: iSessionKeyAccountAbi,
      functionName: "executeWithSessionKey",
      args: [
        txs.map((tx) => ({
          target: tx.target,
          data: tx.data,
          value: tx.value ?? BigInt(0),
        })),
        sessionPublicKey,
      ],
    });

  const account = await createOwnerAccount(signer, accountAddress);
  account.encodeBatchExecute = encodeBatchExecute;
  account.encodeExecute = async (tx) => encodeBatchExecute([tx]);
  account.getInitCode = async () => "0x";
  return account;
}

export interface SendUserOperationParams {
  account: SmartContractAccount;
  target: Address;
  data: Hex;
}

export async function sendUserOperation({
  account,
  target,
  data,
}: SendUserOperationParams): Promise<void> {
  const client = getSmartAccountClient();
  const op = await client.sendUserOperation({
    account,
    uo: { target, data },
  });
  await waitForOperation(op.hash);
}

export interface SessionKeyParams {
  ownerAccount: MultiOwnerModularAccount<SmartAccountSigner>;
  sessionPublicKey: Address;
}

export async function addSessionKeyDeployingIfNeeded(
  params: SessionKeyParams,
): Promise<void> {
  const accountAddress = params.ownerAccount.address;
  const deployed = await isDeployed(accountAddress);
  if (deployed) {
    return addSessionKey(params);
  } else {
    return deployAccountWithSessionKey(params);
  }
}

async function deployAccountWithSessionKey({
  ownerAccount,
  sessionPublicKey,
}: SessionKeyParams): Promise<void> {
  injectLocalMultiOwnerAddress();

  const client = getSmartAccountClient();
  const op = await client.installSessionKeyPlugin({
    account: ownerAccount,
    args: [
      [sessionPublicKey],
      [getSessionKeyTag()],
      [getSessionKeyPermissions()],
    ],
    pluginAddress: SESSION_KEY_PLUGIN_ADDRESS,
  });
  await waitForOperation(op.hash);
}

async function addSessionKey({
  ownerAccount,
  sessionPublicKey,
}: SessionKeyParams): Promise<void> {
  const client = getSmartAccountClient();
  const op = await client.addSessionKey({
    account: ownerAccount,
    key: sessionPublicKey,
    tag: getSessionKeyTag(),
    permissions: getSessionKeyPermissions(),
  });
  await waitForOperation(op.hash);
}

function getSessionKeyTag(): Hex {
  return keccak256(new TextEncoder().encode("worth-of-words"));
}

function getSessionKeyPermissions(): Hex[] {
  return new SessionKeyPermissionsBuilder()
    .addContractAddressAccessEntry({
      contractAddress: WORTH_OF_WORDS_ADDRESS,
      isOnList: true,
      checkSelectors: false,
    })
    .setRequiredPaymaster(PAYMASTER_ADDRESS)
    .setTimeRange({
      validFrom: 0,
      validUntil: ((Date.now() + SESSION_KEY_TTL) / 1000) | 0,
    })
    .encode();
}

async function waitForOperation(hash: Hex): Promise<void> {
  const client = getSmartAccountClient();
  await client.waitForUserOperationTransaction({ hash });
  const receipt = await client.getUserOperationReceipt(hash);
  if (!receipt) {
    throw new Error("User operation receipt not found after waiting.");
  }
  if (!receipt.success) {
    throw new Error("Operation failed during execution.");
  }
}

export async function isDeployed(address: Address): Promise<boolean> {
  const client = getSmartAccountClient();
  const bytecode = await client.getBytecode({ address });
  return bytecode != null && bytecode !== "0x";
}

export interface GetSessionKeyTimeRangeParams {
  accountAddress: Address;
  sessionPublicKey: Address;
}

export async function getSessionKeyExpiryTime({
  accountAddress,
  sessionPublicKey,
}: GetSessionKeyTimeRangeParams): Promise<number> {
  const client = getSmartAccountClient();
  const loupe = getContract({
    address: SESSION_KEY_PLUGIN_ADDRESS,
    abi: SessionKeyPluginAbi,
    client,
  });
  const [, validUntil] = await loupe.read.getKeyTimeRange([
    accountAddress,
    sessionPublicKey,
  ]);
  return 1000 * validUntil;
}

/**
 * `installSessionKeyPlugin` is hardcoded to use the multi-owner plugin address
 * known by the SDK. Update the SDK's known addresses when running on a local
 * network.
 */
function injectLocalMultiOwnerAddress(): void {
  if (MULTI_OWNER_PLUGIN_ADDRESS) {
    MultiOwnerPlugin.meta.addresses[CHAIN.id] = MULTI_OWNER_PLUGIN_ADDRESS;
  }
}

export const getTransport = memoized(() =>
  USE_ANVIL
    ? createSplitTransportForLocalBundler()
    : http(`${WORTH_OF_WORDS_API_URL}/rpc`),
);

function createSplitTransportForLocalBundler(): Transport {
  const chain = foundry;
  const bundlerTransport = http("http://localhost:8546/rpc")({ chain });
  const nodeTransport = http("http://localhost:8545")({ chain });

  const bundlerRpcMethods = new Set([
    "eth_estimateUserOperationGas",
    "eth_sendUserOperation",
    "eth_getUserOperationByHash",
    "eth_getUserOperationReceipt",
    "eth_supportedEntryPoints",
  ]);

  return custom({
    request: ({ method, params }) => {
      if (bundlerRpcMethods.has(method)) {
        return bundlerTransport.request({ method, params });
      } else {
        return nodeTransport.request({ method, params });
      }
    },
  });
}

function memoized<T>(f: () => T): () => T {
  let value: T;
  return () => {
    if (value === undefined) {
      value = f();
    }
    return value;
  };
}
