import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";

import {
  TURNKEY_BASE_URL,
  TURNKEY_PRIVATE_KEY,
  TURNKEY_PUBLIC_KEY,
} from "../constants";

export default new TurnkeyClient(
  { baseUrl: TURNKEY_BASE_URL },
  new ApiKeyStamper({
    apiPublicKey: TURNKEY_PUBLIC_KEY,
    apiPrivateKey: TURNKEY_PRIVATE_KEY,
  })
);
