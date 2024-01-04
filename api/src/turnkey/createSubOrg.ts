import { createActivityPoller, TurnkeyApiTypes } from "@turnkey/http";

import { ORGANIZATION_ID } from "../constants";
import { refineNonNull } from "../util";
import turnkeyClient from "./turnkeyClient";

export type TAttestation = TurnkeyApiTypes["v1Attestation"];

export interface CreateSubOrgWithPrivateKeyRequest {
  subOrgName: string;
  challenge: string;
  privateKeyName: string;
  attestation: TAttestation;
}

export interface WalletDetails {
  id: string;
  address: string;
  subOrgId: string;
}

// Default path for the first Ethereum address in a new HD wallet.
// See https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki, paths are in the form:
//     m / purpose' / coin_type' / account' / change / address_index
// - Purpose is a constant set to 44' following the BIP43 recommendation.
// - Coin type is set to 60 (ETH) -- see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
// - Account, Change, and Address Index are set to 0
const ETHEREUM_WALLET_DEFAULT_PATH = "m/44'/60'/0'/0/0";

export default async function createSubOrg(
  createSubOrgRequest: CreateSubOrgWithPrivateKeyRequest
): Promise<WalletDetails> {
  const activityPoller = createActivityPoller({
    client: turnkeyClient,
    requestFn: turnkeyClient.createSubOrganization,
  });

  const walletName = `Default ETH Wallet`;

  const completedActivity = await activityPoller({
    type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V4",
    timestampMs: String(Date.now()),
    organizationId: ORGANIZATION_ID,
    parameters: {
      subOrganizationName: createSubOrgRequest.subOrgName,
      rootQuorumThreshold: 1,
      rootUsers: [
        {
          userName: "New user",
          apiKeys: [],
          authenticators: [
            {
              authenticatorName: "Passkey",
              challenge: createSubOrgRequest.challenge,
              attestation: createSubOrgRequest.attestation,
            },
          ],
        },
      ],
      wallet: {
        walletName,
        accounts: [
          {
            curve: "CURVE_SECP256K1",
            pathFormat: "PATH_FORMAT_BIP32",
            path: ETHEREUM_WALLET_DEFAULT_PATH,
            addressFormat: "ADDRESS_FORMAT_ETHEREUM",
          },
        ],
      },
    },
  });

  const subOrgId = refineNonNull(
    completedActivity.result.createSubOrganizationResultV4?.subOrganizationId
  );
  const wallet = refineNonNull(
    completedActivity.result.createSubOrganizationResultV4?.wallet
  );
  const walletId = wallet.walletId;
  const walletAddress = wallet.addresses[0];

  return { id: walletId, address: walletAddress, subOrgId };
}
