import { foundry, polygonMumbai } from "viem/chains";

import {
  ANVIL_MINION_FACTORY_ADDRESS,
  ANVIL_WORTH_OF_WORDS_ADDRESS,
} from "../_generated/anvilConstants";
import {
  DEPLOYED_MINION_FACTORY_ADDRESS,
  DEPLOYED_WORTH_OF_WORDS_ADDRESS,
} from "../_generated/deployedConstants";
import { notNull } from "./typechecks";

export const USE_ANVIL = process.env.NODE_ENV !== "production";
export const CHAIN = USE_ANVIL ? foundry : polygonMumbai;
export const ALCHEMY_API_KEY = notNull(process.env.NEXT_PUBLIC_ALCHEMY_ID);
export const WALLET_CONNECT_PROJECT_ID = notNull(
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
);
export const WORD_LENGTH = 5;
// The next two constants correspond to the fixed sizes of the ZK-circuits.
export const SECRET_WORDS_IN_PROOF = 3;
export const GUESSES_IN_PROOF = 3;
export const POLL_INTERVAL_MS = 1000;
export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
export const WORTH_OF_WORDS_ADDRESS = USE_ANVIL
  ? ANVIL_WORTH_OF_WORDS_ADDRESS
  : DEPLOYED_WORTH_OF_WORDS_ADDRESS;
export const MINION_FACTORY_ADDRESS = USE_ANVIL
  ? ANVIL_MINION_FACTORY_ADDRESS
  : DEPLOYED_MINION_FACTORY_ADDRESS;
export const POST_DEADLINE_WAIT_TIME_MS = 4000;
export const SECRET_GENERATING_MESSAGE =
  "Grant this website permission to make Worth of Words moves on your behalf.";
export const PREFUND_VALUE = "0.19";
export const REFILL_VALUE = PREFUND_VALUE;
export const LOW_FUNDS_WARN_THRESHOLD = "0.05";
// Default is 5.
export const FEE_BUFFER_PERCENT = BigInt(5);
