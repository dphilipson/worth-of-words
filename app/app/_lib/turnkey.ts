import {
  getWebAuthnAttestation,
  TurnkeyApiTypes,
  TurnkeyClient,
} from "@turnkey/http";
import { createAccount } from "@turnkey/viem";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";
import axios from "axios";
import { createWalletClient, http } from "viem";

import {
  API_URL,
  CHAIN,
  DOMAIN_NAME,
  TURNKEY_BASE_URL,
  TURNKEY_ORGANIZATION_ID,
} from "./constants";

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
  const account = await createAccount({
    client: passkeyHttpClient,
    organizationId: details.subOrgId,
    signWith: details.address,
    ethereumAddress: details.address,
  });
  const viemClient = createWalletClient({
    account,
    chain: CHAIN,
    transport: http(),
  });
  const signed = await viemClient.signMessage({ message: "Hello, it's me!" });
  console.log(signed);
}

export async function createSubOrgAndWallet(): Promise<WalletDetails> {
  const challenge = generateRandomBuffer();
  const subOrgName = `Worth of Words User - ${subOrgFriendlyDateString()}`;
  const authenticatorUserId = generateRandomBuffer();
  const attestation = await getWebAuthnAttestation({
    publicKey: {
      rp: { id: "localhost", name: "Turnkey Viem Passkey Demo" },
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
