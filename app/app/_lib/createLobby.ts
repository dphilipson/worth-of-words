import { encodeFunctionData, PublicClient } from "viem";

import { iWorthOfWordsAbi } from "../_generated/wagmi";
import { POLL_INTERVAL_MS, WORTH_OF_WORDS_ADDRESS } from "./constants";
import { LobbyConfig } from "./gameLogic";
import { getSmartAccountClient } from "./modularAccount";
import { useWallet, WalletLike } from "./useWallet";

export function useCreateLobby():
  | ((config: LobbyConfig) => Promise<bigint>)
  | undefined {
  const client = getSmartAccountClient() as PublicClient;
  const wallet = useWallet();
  return wallet && ((config) => createLobby(client, wallet, config));
}

async function createLobby(
  publicClient: PublicClient,
  wallet: WalletLike,
  config: LobbyConfig,
): Promise<bigint> {
  let stopWatching = () => {};
  const promise = new Promise<bigint>((resolve, reject) => {
    stopWatching = publicClient.watchContractEvent({
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
  try {
    await wallet.send(
      encodeFunctionData({
        abi: iWorthOfWordsAbi,
        functionName: "createLobby",
        args: [config],
      }),
    );
  } catch (error) {
    stopWatching();
    throw error;
  }
  return promise;
}
