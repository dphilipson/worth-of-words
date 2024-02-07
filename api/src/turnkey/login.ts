import { TSignedRequest } from "@turnkey/http";
import axios from "axios";

import turnkeyClient from "./turnkeyClient";
import { WalletDetails as TurnkeyDetails } from "./types";

export default async function login(
  signedRequest: TSignedRequest
): Promise<TurnkeyDetails | undefined> {
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
  const { organizationId, organizationName } = whoamiResponse.data;
  const walletsResponse = await turnkeyClient.getWallets({
    organizationId,
  });
  const accountsResponse = await turnkeyClient.getWalletAccounts({
    organizationId,
    walletId: walletsResponse.wallets[0].walletId,
  });
  const { walletId, address } = accountsResponse.accounts[0];
  return {
    id: walletId,
    name: organizationName,
    address,
    subOrgId: organizationId,
  };
}
