import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";

import {
  API_PRIVATE_KEY,
  API_PUBLIC_KEY,
  TURNKEY_BASE_URL,
} from "../constants";

export default new TurnkeyClient(
  { baseUrl: TURNKEY_BASE_URL },
  new ApiKeyStamper({
    apiPublicKey: API_PUBLIC_KEY,
    apiPrivateKey: API_PRIVATE_KEY,
  })
);
