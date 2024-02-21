import { keccak256 } from "viem";
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
export const HEAP_ID = notNull(
  IS_PRODUCTION
    ? process.env.NEXT_PUBLIC_PROD_HEAP_ID
    : process.env.NEXT_PUBLIC_DEV_HEAP_ID,
);
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
  ? "0x027FCFdCe05E7eC997f3ee401fBA0607dcc87942"
  : "0x000000e92D78D90000007F0082006FDA09BD5f11";
export const MULTI_OWNER_PLUGIN_ADDRESS = USE_ANVIL
  ? "0x184EA9A5743a77c8F49D8FAeAbde7E091C19e30d"
  : "0xcE0000007B008F50d762D155002600004cD6c647";
export const SESSION_KEY_PLUGIN_ADDRESS = USE_ANVIL
  ? "0x7De4f50078F34833C5FA619bafE4519A83a7C23F"
  : "0x0000003E0000a96de4058e1E02a62FaaeCf23d8d";
export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// Updating this will force all users to create a new account.
export const ACCOUNT_VERSION = 1;
export const ACCOUNT_SALT = BigInt(
  keccak256(new TextEncoder().encode(`worth-of-words:v${ACCOUNT_VERSION}`)),
);

export const ABOUT_MODULAR_ACCOUNTS_URL =
  "https://accountkit.alchemy.com/smart-accounts/accounts/guides/modular-account.html?a=worth-of-words";
export const ABOUT_GAS_MANAGER_URL =
  "https://docs.alchemy.com/docs/gas-manager-services?a=worth-of-words";
export const ABOUT_BUNDLER_URL =
  "https://www.alchemy.com/blog/open-sourcing-rundler?a=worth-of-words";
export const ABOUT_AA_SDK_URL = "https://github.com/alchemyplatform/aa-sdk";
export const ABOUT_ACCOUNT_KIT_URL =
  "https://www.alchemy.com/account-kit?a=worth-of-words";
export const ABOUT_ZERO_KNOWLEDGE_PROOFS_URL =
  "https://en.wikipedia.org/wiki/Zero-knowledge_proof";
