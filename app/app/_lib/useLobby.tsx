import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Address, getContract } from "viem";
import { usePublicClient } from "wagmi";

import { iWorthOfWordsABI } from "../_generated/wagmi";
import {
  POST_DEADLINE_WAIT_TIME_MS,
  WORTH_OF_WORDS_ADDRESS,
} from "./constants";
import { getEventsNowAndForever as getLobbyEventsNowAndForever } from "./events";
import {
  getUpdatedLobbyState,
  LobbyState,
  mutateLobbyState,
  newLobbyState,
  Phase,
} from "./gameLogic";
import { useSetDeadline } from "./hooks";
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
  playerAddress: Address;
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
  const setDeadline = useSetDeadline();

  if (wallet && lobby) {
    if (actionsRef.current === undefined) {
      actionsRef.current = new LobbyActionsImpl(lobbyId, wallet, lobby);
    } else {
      actionsRef.current.setLobbyState(lobby);
    }
  }
  const actions = actionsRef.current;
  const playerAddress = wallet?.address;
  const player =
    lobby && playerAddress && lobby.playersByAddress.get(playerAddress);
  const hasRevealedGuess = player?.revealedGuess !== undefined;

  // When the player has finished a phase, set a timeout to move on to the next
  // phase when the deadline ends.
  useEffect(() => {
    if (!lobby || !actions || !player) {
      return;
    }
    const deadline = lobby.phaseDeadline + POST_DEADLINE_WAIT_TIME_MS;
    if (lobby.phase === Phase.COMMITING_GUESSES && player.hasCommittedGuess) {
      return setDeadline(() => actions.revealGuess(), deadline);
    } else if (lobby.phase === Phase.REVEALING_GUESSES && hasRevealedGuess) {
      return setDeadline(() => actions.revealMatches(), deadline);
    } else if (
      lobby.phase === Phase.REVEALING_MATCHES &&
      player.hasRevealedMatches
    ) {
      return setDeadline(() => actions.endRevealMatchesPhase(), deadline);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    actions,
    lobby?.phaseDeadline,
    lobby?.phase,
    player?.hasCommittedGuess,
    hasRevealedGuess,
    player?.hasRevealedMatches,
  ]);

  // When the phase has advanced, take the automated phase action if we haven't
  // already.
  useEffect(() => {
    if (!lobby || !actions || !player) {
      return;
    }
    if (
      lobby.phase === Phase.REVEALING_GUESSES &&
      player.hasCommittedGuess &&
      !hasRevealedGuess
    ) {
      actions.revealGuess();
    } else if (
      lobby.phase === Phase.REVEALING_MATCHES &&
      !player.hasRevealedMatches
    ) {
      actions.revealMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    actions,
    lobby?.phase,
    player?.hasCommittedGuess,
    hasRevealedGuess,
    player?.hasRevealedMatches,
  ]);

  if (!wallet || !lobby || !validSecretWords || !validGuessWords || !actions) {
    return undefined;
  }

  return {
    playerAddress: wallet.address,
    lobby,
    validSecretWords,
    validGuessWords,
    actions,
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
          console.log("Initial state:", initialState);
        },
        (newEvents) => {
          setState((currentState) => {
            const updatedState = getUpdatedLobbyState(currentState!, newEvents);
            console.log("Events:", newEvents);
            console.log("Updated state:", updatedState);
            return updatedState;
          });
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
