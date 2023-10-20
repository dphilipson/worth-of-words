import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getContract } from "viem";
import { usePublicClient } from "wagmi";

import { iWorthOfWordsABI } from "../_generated/wagmi";
import { WORTH_OF_WORDS_ADDRESS } from "./constants";
import { getEventsNowAndForever as getLobbyEventsNowAndForever } from "./events";
import {
  getUpdatedLobbyState,
  LobbyState,
  mutateLobbyState,
  newLobbyState,
} from "./gameLogic";
import { LobbyActions, LobbyActionsImpl } from "./lobbyActions";
import { useLocalWallet } from "./localWallet";
import { getGuessWordlist, getSecretWordlist } from "./words";

const LobbyContext = createContext<LobbyContext>(undefined!);

export interface LobbyProviderProps {
  lobbyId: bigint;
  loadingComponent: ReactNode;
  children: ReactNode;
}

export function LobbyProvider({
  lobbyId,
  loadingComponent,
  children,
}: LobbyProviderProps): ReactNode {
  const lobby = useLoadLobby(lobbyId);
  if (lobby === undefined) {
    return loadingComponent;
  }
  return (
    <LobbyContext.Provider value={lobby}>{children}</LobbyContext.Provider>
  );
}

export function useLobby(): LobbyContext {
  return useContext(LobbyContext);
}

export interface LobbyContext {
  lobby: LobbyState;
  validSecretWords: Set<string>;
  validGuessWords: Set<string>;
  actions: LobbyActions;
}

// TODO: better (or any) error handling.

function useLoadLobby(lobbyId: bigint): LobbyContext | undefined {
  const wallet = useLocalWallet();
  const lobby = useLobbyState(lobbyId);
  const { data: validSecretWords } = useQuery({
    queryKey: ["valid-secret-words-set"],
    queryFn: async () => {
      const wordlist = await getSecretWordlist();
      return new Set(wordlist);
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
  const { data: validGuessWords } = useQuery({
    queryKey: ["valid-guess-words-set"],
    queryFn: async () => {
      const wordlist = await getGuessWordlist();
      return new Set(wordlist);
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
  const actionsRef = useRef<LobbyActionsImpl>();
  if (!wallet || !lobby || !validSecretWords || !validGuessWords) {
    return undefined;
  }
  if (actionsRef.current === undefined) {
    actionsRef.current = new LobbyActionsImpl(lobbyId, wallet, lobby);
  } else {
    actionsRef.current.setLobbyState(lobby);
  }
  return {
    lobby,
    validSecretWords,
    validGuessWords,
    actions: actionsRef.current,
  };
}

function useLobbyState(lobbyId: bigint): LobbyState | undefined {
  const [state, setState] = useState<LobbyState>();
  const publicClient = usePublicClient();

  useEffect(() => {
    let isCancelled = false;
    let cancelStream = () => {};
    (async () => {
      const worthOfWords = getContract({
        abi: iWorthOfWordsABI,
        address: WORTH_OF_WORDS_ADDRESS,
        publicClient,
      });
      const config = await worthOfWords.read.getLobbyConfig([lobbyId]);
      if (isCancelled) {
        return;
      }
      cancelStream = getLobbyEventsNowAndForever(
        publicClient,
        WORTH_OF_WORDS_ADDRESS,
        lobbyId,
        (initialEvents) => {
          const initialState = newLobbyState(config);
          mutateLobbyState(initialState, initialEvents);
          setState(initialState);
        },
        (newEvents) => {
          setState((currentState) =>
            getUpdatedLobbyState(currentState!, newEvents),
          );
        },
      );
    })();
    return () => {
      isCancelled = true;
      cancelStream();
    };
  }, [lobbyId, publicClient]);

  return state;
}
