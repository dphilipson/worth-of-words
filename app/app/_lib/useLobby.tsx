import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Address, getContract, PublicClient } from "viem";

import { iWorthOfWordsAbi } from "../_generated/wagmi";
import {
  POST_DEADLINE_WAIT_TIME_MS,
  WORTH_OF_WORDS_ADDRESS,
} from "./constants";
import { emptyList } from "./empty";
import { getLobbyEventsNowAndForever, LobbyEvent } from "./events";
import {
  getUpdatedLobbyState,
  LobbyState,
  newLobbyState,
  Phase,
} from "./gameLogic";
import { useSetDeadline } from "./hooks";
import { LobbyActions, LobbyActionsImpl } from "./lobbyActions";
import { useLobbyStorage } from "./lobbyStorage";
import { getSmartAccountClient } from "./modularAccount";
import { useWallet } from "./useWallet";
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

export interface LobbyContext {
  playerAddress: Address;
  lobby: LobbyState;
  validSecretWords: Set<string>;
  validGuessWords: Set<string>;
  actions: LobbyActions;
  secrets: string[];
  advanceToNextRound: (() => void) | undefined;
}

export function useLobby(): LobbyContext {
  return useContext(LobbyContext);
}

// TODO: better (or any) error handling.

function useLoadLobby(lobbyId: bigint): LobbyContext | undefined {
  const wallet = useWallet();
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
  const playerAddress = wallet?.address;
  const storage = useLobbyStorage(lobby?.id, playerAddress);
  const actionsRef = useRef<LobbyActionsImpl>();
  const setDeadline = useSetDeadline();
  const advancedToRoundNumber = storage?.advancedToRound ?? 0;
  const player =
    lobby && playerAddress && lobby.playersByAddress.get(playerAddress);

  const advanceToNextRound = useCallback(() => {
    const roundNumber = lobby?.roundNumber;
    const setAdvancedToRound = storage?.setAdvancedToRound;
    if (roundNumber !== undefined && setAdvancedToRound) {
      // Somewhat of a hack: if the player is eliminated, then we don't need
      // their input to advance rounds again, so treat them as having advanced
      // to a very high round number.
      setAdvancedToRound(player?.isEliminated ? 10000 : roundNumber);
    }
  }, [lobby?.roundNumber, storage?.setAdvancedToRound, player?.isEliminated]);

  if (wallet && lobby && storage) {
    if (actionsRef.current === undefined) {
      actionsRef.current = new LobbyActionsImpl(
        lobbyId,
        wallet,
        storage,
        lobby,
      );
    } else {
      actionsRef.current.setLobbyStorage(storage);
      actionsRef.current.setLobbyState(lobby);
    }
  }
  const actions = actionsRef.current;
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

  const isViewingPreviousRound =
    advancedToRoundNumber < lobby.roundNumber && !!lobby.previousRoundSnapshot;
  const lobbyView = isViewingPreviousRound
    ? lobby.previousRoundSnapshot!
    : lobby;
  return {
    playerAddress: wallet.address,
    lobby: lobbyView,
    validSecretWords,
    validGuessWords,
    actions,
    secrets: storage?.secrets?.words ?? emptyList(),
    advanceToNextRound: isViewingPreviousRound ? advanceToNextRound : undefined,
  };
}

function useLobbyState(lobbyId: bigint): LobbyState | undefined {
  const [state, setState] = useState<LobbyState>();
  const publicClient = getSmartAccountClient() as PublicClient;

  useEffect(() => {
    if (!publicClient) {
      return;
    }

    let isCancelled = false;
    let cancelStream = () => {};
    (async () => {
      const worthOfWords = getContract({
        abi: iWorthOfWordsAbi,
        address: WORTH_OF_WORDS_ADDRESS,
        client: publicClient,
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
          const initialState = getUpdatedLobbyState(
            newLobbyState(lobbyId, config),
            initialEvents,
          );
          setState(initialState);
          console.log("Initial state:", initialState);
          return !isGameEnding(initialEvents);
        },
        (newEvents) => {
          setState((currentState) => {
            if (!currentState) {
              throw new Error(
                "Received new events before state was initialized",
              );
            }
            const updatedState = getUpdatedLobbyState(currentState, newEvents);
            console.log("Events:", newEvents);
            console.log("Updated state:", updatedState);
            return updatedState;
          });
          return !isGameEnding(newEvents);
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

function isGameEnding(events: LobbyEvent[]): boolean {
  return events.some((event) => event.eventName === "GameEnded");
}
