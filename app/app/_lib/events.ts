import { Address, decodeEventLog, Hex } from "viem";
import { PublicClient } from "wagmi";

import { iWorthOfWordsABI } from "../_generated/wagmi";
import { delay } from "./async";
import { POLL_INTERVAL_MS } from "./constants";

const fakeEvent =
  (false as true) &&
  decodeEventLog({
    abi: iWorthOfWordsABI,
    data: undefined!,
    topics: undefined!,
    strict: true,
  });

export type LobbyEvent = typeof fakeEvent;

export function getEventsNowAndForever(
  client: PublicClient,
  address: Address,
  lobbyId: bigint,
  onInitialLogs: (logs: LobbyEvent[]) => void,
  onNewLogs: (logs: LobbyEvent[]) => void,
): () => void {
  let isCancelled = false;
  let hasSentInitialLogs = false;
  (async () => {
    const filterId = await client.request({
      method: "eth_newFilter" as any,
      params: [
        {
          fromBlock: "0x0",
          address,
          topics: [null, numberAsTopic(lobbyId)],
        },
      ],
    });
    while (true) {
      const logs: any[] = await client.request({
        method: "eth_getFilterChanges" as any,
        params: [filterId as any],
      });
      if (isCancelled) {
        return;
      }
      const decodedLogs: LobbyEvent[] = logs.map((log) =>
        decodeEventLog({
          abi: iWorthOfWordsABI,
          data: log.data,
          topics: log.topics,
          strict: true,
        }),
      );
      if (!hasSentInitialLogs) {
        hasSentInitialLogs = true;
        onInitialLogs(decodedLogs);
        onInitialLogs = undefined!;
      } else if (decodedLogs.length > 0) {
        onNewLogs(decodedLogs);
      }
      await delay(POLL_INTERVAL_MS);
    }
  })();
  return () => (isCancelled = true);
}

function numberAsTopic(n: number | bigint): Hex {
  return `0x${n.toString(16).padStart(64, "0")}`;
}
