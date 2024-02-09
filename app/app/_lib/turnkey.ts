import {
  TurnkeySigner,
  TurnkeySubOrganization,
} from "@alchemy/aa-signers/turnkey";
import {
  getWebAuthnAttestation,
  TurnkeyApiTypes,
  TurnkeyClient,
} from "@turnkey/http";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";
import axios from "axios";
import { Address } from "viem";

import {
  DOMAIN_NAME,
  TURNKEY_BASE_URL,
  TURNKEY_ORGANIZATION_ID,
  WORTH_OF_WORDS_API_URL,
} from "./constants";
import { useLocalStorage } from "./hooks";
import { getTransport } from "./modularAccount";

const CREATE_SUB_ORG_URL = `${WORTH_OF_WORDS_API_URL}/create-sub-org`;
const LOGIN_URL = `${WORTH_OF_WORDS_API_URL}/login`;
const DETAILS_KEY = "worth-of-words:turnkey-details";

type TAttestation = TurnkeyApiTypes["v1Attestation"];

interface CreateSubOrgWithPrivateKeyRequest {
  subOrgName: string;
  challenge: string;
  attestation: TAttestation;
}

export interface TurnkeyDetails {
  id: string;
  name: string;
  address: Address;
  subOrgId: string;
}

const passkeyHttpClient = new TurnkeyClient(
  { baseUrl: TURNKEY_BASE_URL },
  new WebauthnStamper({ rpId: DOMAIN_NAME }),
);

export function useTurnkeyDetails() {
  return useLocalStorage<TurnkeyDetails>({ key: DETAILS_KEY });
}

export async function createSubOrgAndWallet(): Promise<TurnkeyDetails> {
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
  const response = await axios.post<TurnkeyDetails>(
    CREATE_SUB_ORG_URL,
    request,
  );
  return response.data;
}

export async function login(): Promise<TurnkeyDetails | undefined> {
  const signedRequest = await passkeyHttpClient.stampGetWhoami({
    organizationId: TURNKEY_ORGANIZATION_ID,
  });
  const response = await axios.post<TurnkeyDetails | null>(
    LOGIN_URL,
    signedRequest,
  );
  // API returns empty response if user does not exist.
  return response.data || undefined;
}

export async function getTurnkeySigner(
  details: TurnkeyDetails,
): Promise<TurnkeySigner> {
  // Give the signer a tweaked client which returns a fixed response for whoami.
  // We must call `signer.authenticate` before using the signer, which by
  // default would trigger a passkey prompt. Since we already have this
  // information, we can stub it out.
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
    transport: getTransport(),
    resolveSubOrganization: async () =>
      new TurnkeySubOrganization({
        subOrganizationId: details.subOrgId,
        signWith: details.address,
      }),
  });
  return signer;
}

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
