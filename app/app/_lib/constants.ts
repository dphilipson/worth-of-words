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

export const USE_ANVIL = false;

export const CHAIN = USE_ANVIL ? foundry : polygonMumbai;
export const ALCHEMY_API_KEY = notNull(process.env.NEXT_PUBLIC_ALCHEMY_ID);
export const WALLET_CONNECT_PROJECT_ID = notNull(
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
);
export const WORD_LENGTH = 5;
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
  "Grant this website permission to make Worth of Words moves on your behalf?";
export const PREFUND_VALUE = "0.2";
// Default is 50. Make this big so demo runs smoothly, since we don't have real
// error handling.
export const FEE_BUFFER_PERCENT = BigInt(150);
