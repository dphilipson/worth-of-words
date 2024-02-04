import {
  createMultiOwnerModularAccount,
  MultiOwnerPlugin,
  MultiOwnerPluginExecutionFunctionAbi,
  SessionKeyPermissionsBuilder,
  SessionKeyPluginAbi,
  sessionKeyPluginActions,
  SessionKeyPluginExecutionFunctionAbi,
  SessionKeySigner,
} from "@alchemy/aa-accounts";
import {
  createBundlerClient,
  createBundlerClientFromExisting,
  createSmartAccountClient,
  createSmartAccountClientFromExisting,
  deepHexlify,
  getUserOperationHash,
  LocalAccountSigner,
  SmartAccountSigner,
  SmartContractAccount,
  toSmartContractAccount,
} from "@alchemy/aa-core";
import {
  TurnkeySigner,
  TurnkeySubOrganization,
} from "@alchemy/aa-signers/turnkey";
import {
  getWebAuthnAttestation,
  TurnkeyApiTypes,
  TurnkeyClient,
} from "@turnkey/http";
import { createAccount } from "@turnkey/viem";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";
import axios from "axios";
import {
  Address,
  Chain,
  createPublicClient,
  createWalletClient,
  custom,
  EIP1193RequestFn,
  encodeFunctionData,
  getContract,
  Hex,
  http,
  Transport,
  TransportConfig,
} from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import { foundry } from "viem/chains";
import { hexToBytes, keccak256, rpc } from "viem/utils";

import {
  API_URL,
  CHAIN,
  CHAIN_URL,
  DOMAIN_NAME,
  ENTRY_POINT_ADDRESS,
  MSCA_FACTORY_ADDRESS,
  MULTI_OWNER_PLUGIN_ADDRESS,
  TURNKEY_BASE_URL,
  TURNKEY_ORGANIZATION_ID,
  USE_ANVIL,
} from "./constants";
import { randomBytes32 } from "./random";
import { notNull } from "./typechecks";
import {
  iSessionKeyAccountAbi,
  iSessionKeyAccountFactoryAbi,
  iSessionKeyPermissionsUpdatesAbi,
} from "../_generated/wagmi";

const CREATE_SUB_ORG_URL = `${API_URL}/create-sub-org`;
const LOGIN_URL = `${API_URL}/login`;

type TAttestation = TurnkeyApiTypes["v1Attestation"];

interface CreateSubOrgWithPrivateKeyRequest {
  subOrgName: string;
  challenge: string;
  attestation: TAttestation;
}

export interface WalletDetails {
  id: string;
  address: string;
  subOrgId: string;
}

const passkeyHttpClient = new TurnkeyClient(
  { baseUrl: TURNKEY_BASE_URL },
  new WebauthnStamper({ rpId: DOMAIN_NAME }),
);

export async function testTheSigning(): Promise<void> {
  const details = await login();
  if (!details) {
    throw new Error("no details");
  }
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const FACTORY_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  const SESSION_KEY_PLUGIN_ADDRESS =
    "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  const ANVIL_PRIVATE_KEY =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const fundedClient = createWalletClient({
    account: privateKeyToAccount(ANVIL_PRIVATE_KEY),
    chain: foundry,
    transport: http(),
  });
  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(),
  });
  const getAddressResult = await publicClient.call({
    to: FACTORY_ADDRESS,
    data: encodeFunctionData({
      abi: iSessionKeyAccountFactoryAbi,
      functionName: "getAddress",
      args: [BigInt(0), [details.address as Hex]],
    }),
  });
  const accountAddress = bytesToAddress(notNull(getAddressResult.data));
  console.log({ accountAddress });

  const accountIsDeployed = !!(await publicClient.getBytecode({
    address: accountAddress,
  }));
  if (accountIsDeployed) {
    console.error("Account already deployed. What will happen?");
  }
  const turnkeySigner = await getTurnkeySignerWithCachedDetails(details);

  const client = createSmartAccountClient({
    chain: CHAIN,
    transport: getTransport(),
  }).extend(sessionKeyPluginActions);

  const ownerAccount = await createOwnerAccount(turnkeySigner);

  if (ownerAccount.address.toLowerCase() !== accountAddress.toLowerCase()) {
    console.error(
      "addresses did not match:",
      ownerAccount.address,
      accountAddress,
    );
    return;
  }

  console.log({ accountAddress });
  const fundingTxHash = await fundedClient.sendTransaction({
    to: accountAddress,
    value: BigInt(1e18), // 1 ETH
  });
  await publicClient.waitForTransactionReceipt({ hash: fundingTxHash });

  injectLocalMultiOwnerAddress();

  const sessionPrivateKey = randomBytes32();
  const sessionPublicKey = privateKeyToAddress(sessionPrivateKey);

  console.log({ sessionPrivateKey, sessionPublicKey });
  const sessionKeyAccount = await createSessionKeyAccount({
    accountAddress,
    sessionPrivateKey,
  });

  const sessionKeyPermissions = new SessionKeyPermissionsBuilder()
    .setContractAccessControlType(2)
    .encode();

  const installUo = await client.installSessionKeyPlugin({
    account: ownerAccount,
    args: [
      [sessionPublicKey],
      [keccak256(new TextEncoder().encode("worth-of-words"))],
      [sessionKeyPermissions],
    ],
    pluginAddress: SESSION_KEY_PLUGIN_ADDRESS,
  });

  console.log("sent install uo:", installUo);

  const txHash = await client.waitForUserOperationTransaction({
    hash: installUo.hash,
  });
  console.log("uo mined in transaction:", txHash);

  const receipt = await client.getUserOperationReceipt(installUo.hash);
  console.log({ receipt });

  if (!receipt?.success) {
    throw new Error("Install plugin failed.");
  }

  console.log("Getting nonce");
  const nonce = await sessionKeyAccount.getNonce();
  console.log({ nonce });

  console.log("about to test send");
  const lastOp = await client.buildUserOperation({
    uo: { target: "0x0000000000000000000000000000000000000001", data: "0x" },
    account: sessionKeyAccount,
  });
  const lastOpHash = getUserOperationHash(
    deepHexlify(lastOp),
    ENTRY_POINT_ADDRESS,
    BigInt(foundry.id),
  );
  console.log({ lastOpHash });

  const isSessionKeyResult = await client.call({
    to: SESSION_KEY_PLUGIN_ADDRESS,
    data: encodeFunctionData({
      abi: SessionKeyPluginAbi,
      functionName: "isSessionKeyOf",
      args: [accountAddress, sessionPublicKey],
    }),
  });

  console.log({ isSessionKeyResult });

  const testSendResult = await client.sendUserOperation({
    uo: { target: "0x0000000000000000000000000000000000000001", data: "0x" },
    account: sessionKeyAccount,
  });
  console.log("sent test session key uo:", testSendResult);
  await client.waitForUserOperationTransaction({
    hash: testSendResult.hash,
  });
  const lastReceipt = await client.getUserOperationReceipt(testSendResult.hash);
  console.log({ lastReceipt });
}

async function getTurnkeySignerWithCachedDetails(
  details: WalletDetails,
): Promise<TurnkeySigner> {
  const cachedWhoamiClient = new Proxy(passkeyHttpClient, {
    get: (target, property) => {
      if (property === "getWhoami") {
        return () => Promise.resolve(details);
      } else {
        return (target as any)[property];
      }
    },
  });
  const signer = new TurnkeySigner({ inner: cachedWhoamiClient });
  await signer.authenticate({
    transport: http("http://localhost:8545"),
    resolveSubOrganization: async () =>
      new TurnkeySubOrganization({
        subOrganizationId: details.subOrgId,
        signWith: details.address,
      }),
  });
  return signer;
}

export async function createSubOrgAndWallet(): Promise<WalletDetails> {
  const challenge = generateRandomBuffer();
  const subOrgName = `Worth of Words User - ${subOrgFriendlyDateString()}`;
  const authenticatorUserId = generateRandomBuffer();
  const attestation = await getWebAuthnAttestation({
    publicKey: {
      rp: { id: "localhost", name: "Worth of Words" },
      challenge,
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      user: {
        id: authenticatorUserId,
        name: subOrgName,
        displayName: subOrgName,
      },
    },
  });
  const request: CreateSubOrgWithPrivateKeyRequest = {
    subOrgName,
    attestation,
    challenge: base64UrlEncode(challenge),
  };
  const response = await axios.post<WalletDetails>(CREATE_SUB_ORG_URL, request);
  console.log("response:", response.data);
  return response.data;
}

export async function login(): Promise<WalletDetails | undefined> {
  const signedRequest = await passkeyHttpClient.stampGetWhoami({
    organizationId: TURNKEY_ORGANIZATION_ID,
  });
  const response = await axios.post<WalletDetails | null>(
    LOGIN_URL,
    signedRequest,
  );
  console.log("response:", response.data);
  // API returns empty response if user does not exist.
  return response.data || undefined;
}

export async function sign(): Promise<void> {}

function generateRandomBuffer(): ArrayBuffer {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr.buffer;
}

function base64UrlEncode(challenge: ArrayBuffer): string {
  return Buffer.from(challenge)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function subOrgFriendlyDateString(): string {
  // Sub-org names can't have / or : characters.
  return new Date().toLocaleString().replaceAll("/", "-").replaceAll(":", ".");
}

const bundlerRpcMethods = new Set([
  "eth_estimateUserOperationGas",
  "eth_sendUserOperation",
  "eth_getUserOperationByHash",
  "eth_getUserOperationReceipt",
  "eth_supportedEntryPoints",
]);

function createSplitRpcTransport(): Transport {
  const chain = foundry;
  const bundlerTransport = http("http://localhost:8546/rpc")({ chain });
  const nodeTransport = http("http://localhost:8545")({ chain });
  return custom({
    async request({ method, params }) {
      if (bundlerRpcMethods.has(method)) {
        return bundlerTransport.request({ method, params });
      } else {
        return nodeTransport.request({ method, params });
      }
    },
  });
}

function getTransport() {
  return USE_ANVIL ? createSplitRpcTransport() : http(CHAIN_URL);
}

function createOwnerAccount(
  owner: SmartAccountSigner,
  accountAddress?: Address,
) {
  return createMultiOwnerModularAccount({
    transport: getTransport(),
    chain: CHAIN,
    owner,
    accountAddress,
    entrypointAddress: ENTRY_POINT_ADDRESS,
    factoryAddress: MSCA_FACTORY_ADDRESS,
    excludeDefaultTokenReceiverPlugin: true,
  });
}

interface CreateSessionKeyAccountParams {
  accountAddress: Address;
  sessionPrivateKey: Hex;
}

type Tx = {
  target: Address;
  value?: bigint;
  data: Hex | "0x";
};

async function createSessionKeyAccount({
  accountAddress,
  sessionPrivateKey,
}: CreateSessionKeyAccountParams) {
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

function bytesToAddress(bytes: Hex): Address {
  return `0x${bytes.slice(bytes.length - 40)}`;
}

function injectLocalMultiOwnerAddress(): void {
  if (MULTI_OWNER_PLUGIN_ADDRESS) {
    MultiOwnerPlugin.meta.addresses[CHAIN.id] = MULTI_OWNER_PLUGIN_ADDRESS;
  }
}

function getSessionKeyAccountPatch({
  sessionPublicKey,
}: {
  sessionPublicKey: Address;
}): Pick<
  SmartContractAccount,
  "encodeExecute" | "encodeBatchExecute" | "getInitCode"
> {
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
  return {
    encodeBatchExecute,
    encodeExecute: async (tx) => encodeBatchExecute([tx]),
    getInitCode: async () => "0x",
  };
}
