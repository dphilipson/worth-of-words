import { TSignedRequest } from "@turnkey/http";
import axios from "axios";

import turnkeyClient from "./turnkeyClient";
import { WalletDetails } from "./types";

export default async function login(
  signedRequest: TSignedRequest
): Promise<WalletDetails | undefined> {
  // This signed request is a signed whoami request, coming from the frontend, signed by the end-user's passkey.
  const whoamiResponse = await axios.post(
    signedRequest.url,
    signedRequest.body,
    {
      headers: {
        [signedRequest.stamp.stampHeaderName]:
          signedRequest.stamp.stampHeaderValue,
      },
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    }
  );
  if (whoamiResponse.status === 404) {
    // Account does not exist.
    return undefined;
  }
  const subOrgId = whoamiResponse.data.organizationId;
  const walletsResponse = await turnkeyClient.getWallets({
    organizationId: subOrgId,
  });
  const accountsResponse = await turnkeyClient.getWalletAccounts({
    organizationId: subOrgId,
    walletId: walletsResponse.wallets[0].walletId,
  });
  const walletId = accountsResponse.accounts[0].walletId;
  const walletAddress = accountsResponse.accounts[0].address;
  return { id: walletId, address: walletAddress, subOrgId };
}
