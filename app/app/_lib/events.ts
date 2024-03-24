import { Address, decodeEventLog, Hex, PublicClient, toHex } from "viem";

import { iWorthOfWordsAbi } from "../_generated/wagmi";
import { delay } from "./async";
import { POLL_INTERVAL_MS } from "./constants";

const fakeEvent =
  (false as true) &&
  decodeEventLog({
    abi: iWorthOfWordsAbi,
    data: undefined!,
    topics: undefined!,
    strict: true,
  });

export type LobbyEvent = typeof fakeEvent;

export function getLobbyEventsNowAndForever(
  client: PublicClient,
  address: Address,
  lobbyId: bigint,
  // Returns true if should continue.
  onInitialLogs: (logs: LobbyEvent[]) => boolean,
  // Ditto.
  onNewLogs: (logs: LobbyEvent[]) => boolean,
): () => void {
  let isCancelled = false;
  let hasSentInitialLogs = false;
  (async () => {
    let nextStartBlock = BigInt(0);
    while (true) {
      const { events, nextBlockNumber } = await getEventsSince(
        client,
        address,
        lobbyId,
        nextStartBlock,
      );
      nextStartBlock = nextBlockNumber;
      if (isCancelled) {
        return;
      }
      let shouldContinue = true;
      if (!hasSentInitialLogs) {
        hasSentInitialLogs = true;
        shouldContinue &&= onInitialLogs(events);
        onInitialLogs = undefined!;
      } else if (events.length > 0) {
        shouldContinue &&= onNewLogs(events);
      }
      if (!shouldContinue) {
        return;
      }
      await delay(POLL_INTERVAL_MS);
      if (isCancelled) {
        return;
      }
    }
  })();
  return () => (isCancelled = true);
}

interface EventsSinceOut {
  events: LobbyEvent[];
  nextBlockNumber: bigint;
}

async function getEventsSince(
  client: PublicClient,
  address: Address,
  lobbyId: bigint,
  startBlockNumber: bigint,
): Promise<EventsSinceOut> {
  const currentBlockNumber = await client.getBlockNumber();
  if (currentBlockNumber < startBlockNumber) {
    return { events: [], nextBlockNumber: startBlockNumber };
  }
  const logs: any[] = await client.request({
    method: "eth_getLogs",
    params: [
      {
        fromBlock: toHex(startBlockNumber),
        toBlock: toHex(currentBlockNumber),
        address,
        topics: [null, numberAsTopic(lobbyId)],
      },
    ],
  });
  const events: LobbyEvent[] = logs.map((log) =>
    decodeEventLog({
      abi: iWorthOfWordsAbi,
      data: log.data,
      topics: log.topics,
      strict: true,
    }),
  );
  return { events, nextBlockNumber: currentBlockNumber + BigInt(1) };
}

function numberAsTopic(n: number | bigint): Hex {
  return `0x${n.toString(16).padStart(64, "0")}`;
}
