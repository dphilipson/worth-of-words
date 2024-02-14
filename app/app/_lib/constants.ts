import { arbitrumSepolia, foundry } from "viem/chains";

import {
  ANVIL_PAYMASTER_ADDRESS,
  ANVIL_WORTH_OF_WORDS_ADDRESS,
} from "../_generated/anvilConstants";
import { DEPLOYED_WORTH_OF_WORDS_ADDRESS } from "../_generated/deployedConstants";
import { notNull } from "./typechecks";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const USE_ANVIL = !IS_PRODUCTION;
export const USE_DEBUG_ACCOUNTS = !IS_PRODUCTION;
export const CHAIN = USE_ANVIL ? foundry : arbitrumSepolia;
export const WORTH_OF_WORDS_API_URL = IS_PRODUCTION
  ? "https://api.worthofwords.com"
  : "http://localhost:3001";
export const RPC_URL = `${WORTH_OF_WORDS_API_URL}/rpc`;
export const TURNKEY_BASE_URL = "https://api.turnkey.com";
export const TURNKEY_ORGANIZATION_ID = notNull(
  process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID,
);
export const DOMAIN_NAME = IS_PRODUCTION ? "www.worthofwords.com" : "localhost";
export const WORD_LENGTH = 5;
// The next two constants correspond to the fixed sizes of the ZK-circuits.
export const SECRET_WORDS_IN_PROOF = 3;
export const GUESSES_IN_PROOF = 3;
export const POLL_INTERVAL_MS = IS_PRODUCTION ? 1000 : 250;
export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
export const WORTH_OF_WORDS_ADDRESS = USE_ANVIL
  ? ANVIL_WORTH_OF_WORDS_ADDRESS
  : DEPLOYED_WORTH_OF_WORDS_ADDRESS;
export const POST_DEADLINE_WAIT_TIME_MS = 4000;
// Default is 5.
export const FEE_BUFFER_PERCENT = BigInt(5);
export const SESSION_KEY_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days
export const REFRESH_SESSION_KEY_AT_TTL = 1000 * 60 * 5; // 5 minutes
export const GAS_MANAGER_ADDRESS = "0x0804Afe6EEFb73ce7F93CD0d5e7079a5a8068592";
export const PAYMASTER_ADDRESS = USE_ANVIL
  ? ANVIL_PAYMASTER_ADDRESS
  : GAS_MANAGER_ADDRESS;

export const MSCA_FACTORY_ADDRESS = USE_ANVIL
  ? "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  : "0x000000e92D78D90000007F0082006FDA09BD5f11";
export const MULTI_OWNER_PLUGIN_ADDRESS = USE_ANVIL
  ? "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  : "0xcE0000007B008F50d762D155002600004cD6c647";
export const SESSION_KEY_PLUGIN_ADDRESS = USE_ANVIL
  ? "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
  : "0x0000005B4b6A5a890fCD500095738Cb17B4DD042";
export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
