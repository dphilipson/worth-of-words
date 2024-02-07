import { encodeFunctionData, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

import { iWorthOfWordsAbi } from "../_generated/wagmi";
import { POLL_INTERVAL_MS, WORTH_OF_WORDS_ADDRESS } from "./constants";
import { LobbyConfig } from "./gameLogic";
import { useWallet, WalletLike } from "./useWallet";

export function useCreateLobby():
  | ((config: LobbyConfig) => Promise<bigint>)
  | undefined {
  const publicClient = usePublicClient();
  const wallet = useWallet();
  return (
    publicClient &&
    wallet &&
    ((config) => createLobby(publicClient, wallet, config))
  );
}

async function createLobby(
  publicClient: PublicClient,
  wallet: WalletLike,
  config: LobbyConfig,
): Promise<bigint> {
  // TODO: Timeout or something if it goes too long.
  const promise = new Promise<bigint>((resolve, reject) => {
    const stopWatching = publicClient.watchContractEvent({
      abi: iWorthOfWordsAbi,
      address: WORTH_OF_WORDS_ADDRESS,
      eventName: "LobbyCreated",
      args: { creator: wallet.address },
      pollingInterval: POLL_INTERVAL_MS,
      strict: true,
      onLogs: (logs) => {
        stopWatching();
        resolve(logs[0].args.lobbyId);
      },
      onError: (error) => {
        stopWatching();
        reject(error);
      },
    });
  });
  await wallet.send(
    encodeFunctionData({
      abi: iWorthOfWordsAbi,
      functionName: "createLobby",
      args: [config],
    }),
  );
  return promise;
}
