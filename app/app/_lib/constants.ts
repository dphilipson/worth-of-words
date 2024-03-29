import { keccak256 } from "viem";
import { arbitrumSepolia, foundry, optimismSepolia } from "viem/chains";

import {
  ANVIL_PAYMASTER_ADDRESS,
  ANVIL_WORTH_OF_WORDS_ADDRESS,
} from "../_generated/anvilConstants";
import { DEPLOYED_WORTH_OF_WORDS_ADDRESS } from "../_generated/deployedConstants";
import { notNull } from "./typechecks";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const USE_ANVIL = !IS_PRODUCTION;
export const USE_DEBUG_ACCOUNTS = !IS_PRODUCTION;
export const CHAIN = USE_ANVIL ? foundry : optimismSepolia;
export const WORTH_OF_WORDS_API_URL = IS_PRODUCTION
  ? "https://api.worthofwords.com"
  : "http://localhost:3001";
export const RPC_URL = `${WORTH_OF_WORDS_API_URL}/rpc`;
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
export const WORTH_OF_WORDS_ADDRESS = USE_ANVIL
  ? ANVIL_WORTH_OF_WORDS_ADDRESS
  : DEPLOYED_WORTH_OF_WORDS_ADDRESS;
export const POST_DEADLINE_WAIT_TIME_MS = 4000;
export const SESSION_KEY_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days
export const REFRESH_SESSION_KEY_AT_TTL = 1000 * 60 * 5; // 5 minutes
export const GAS_MANAGER_ADDRESS =
  CHAIN.id === (arbitrumSepolia.id as number)
    ? "0x0804Afe6EEFb73ce7F93CD0d5e7079a5a8068592"
    : "0x4f84a207A80c39E9e8BaE717c1F25bA7AD1fB08F";
export const PAYMASTER_ADDRESS = USE_ANVIL
  ? ANVIL_PAYMASTER_ADDRESS
  : GAS_MANAGER_ADDRESS;

export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
export const MSCA_FACTORY_ADDRESS =
  "0x000000e92D78D90000007F0082006FDA09BD5f11";
export const MULTI_OWNER_PLUGIN_ADDRESS =
  "0xcE0000007B008F50d762D155002600004cD6c647";
export const SESSION_KEY_PLUGIN_ADDRESS =
  "0x0000003E0000a96de4058e1E02a62FaaeCf23d8d";
export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// Updating this will force all users to create a new account.
export const ACCOUNT_VERSION = 1;
export const ACCOUNT_SALT = BigInt(
  keccak256(new TextEncoder().encode(`worth-of-words:v${ACCOUNT_VERSION}`)),
);

export const ABOUT_MODULAR_ACCOUNTS_URL =
  "https://accountkit.alchemy.com/smart-accounts/modular-account?a=worth-of-words";
export const ABOUT_GAS_MANAGER_URL =
  "https://docs.alchemy.com/docs/gas-manager-services?a=worth-of-words";
export const ABOUT_BUNDLER_URL =
  "https://www.alchemy.com/blog/open-sourcing-rundler?a=worth-of-words";
export const ABOUT_AA_SDK_URL = "https://github.com/alchemyplatform/aa-sdk";
export const ABOUT_EMBEDDED_ACCOUNTS_URL =
  "https://www.alchemy.com/embedded-accounts?a=worth-of-words";
export const ABOUT_ZERO_KNOWLEDGE_PROOFS_URL =
  "https://en.wikipedia.org/wiki/Zero-knowledge_proof";
