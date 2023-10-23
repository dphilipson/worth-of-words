import { produce } from "immer";
import { chainFrom } from "transducist";
import { Address, Hex } from "viem";

import { LobbyEvent } from "./events";

export interface LobbyState {
  config: LobbyConfig;
  playersByAddress: Map<Address, Player>;
  currentRoundPlayerOrder: Address[];
  nextRoundPlayerSet: Set<Address>;
  targetOffsets: number[];
  roundNumber: number;
  phase: Phase;
  phaseDeadline: number;
  previousRoundSnapshot: LobbyState | undefined;
}

export interface Player {
  address: Address;
  name: string;
  score: number;
  livesLeft: number;
  isEliminated: boolean;
  revealedSecrets: string[];
  matchHistory: ScoredGuess[];
  hasCommittedGuess: boolean;
  revealedGuess: string | undefined;
  hasRevealedMatches: boolean;
  fullyRevealedSecret: string | undefined;
}

export interface ScoredGuess {
  attacker: Address;
  guess: string;
  matches: Color[];
  newYellowCount: number;
  newGreenCount: number;
  pointsAwarded: number;
}

export enum Color {
  GRAY = 0,
  YELLOW = 1,
  GREEN = 2,
}

export enum Phase {
  NOT_STARTED = 0,
  COMMITING_GUESSES = 1,
  REVEALING_GUESSES = 2,
  REVEALING_MATCHES = 3,
  GAME_OVER = 4,
}

export interface LobbyConfig {
  secretWordMerkleRoot: bigint;
  privateGamePublicKey: Address;
  minPlayers: number;
  maxPlayers: number;
  guessWordMerkleRoot: Hex;
  maxCommitGuessTime: number;
  maxRevealGuessTime: number;
  maxRevealMatchesTime: number;
  maxRounds: number;
  numLives: number;
  pointsForYellow: number;
  pointsForGreen: number;
  pointsForFullWord: number;
}

export function newLobbyState(config: LobbyConfig): LobbyState {
  return {
    config,
    playersByAddress: new Map(),
    currentRoundPlayerOrder: [],
    nextRoundPlayerSet: new Set(),
    targetOffsets: [],
    roundNumber: -1, // Will be increased to 0 at first rond start.
    phase: Phase.NOT_STARTED,
    phaseDeadline: 0,
    previousRoundSnapshot: undefined,
  };
}

export function getUpdatedLobbyState(
  initialState: LobbyState,
  events: LobbyEvent[],
): LobbyState {
  // Special case for round-ending events. We want to get a snapshot of the
  // state right before the event that ends the round and store it in the state
  // for next round.
  const lastRoundEndingEventIndex = getLastRoundEndingEventIndex(events);
  if (lastRoundEndingEventIndex === undefined) {
    return produce(initialState, (state) => {
      for (const event of events) {
        mutateLobbyStateSingleEvent(state, event);
      }
    });
  }
  // Get the state right before the round ending event. Then get the state from
  // applying the rest of the events and put the earlier state into it.
  const previousRoundSnapshot = produce(initialState, (state) => {
    chainFrom(events)
      .take(lastRoundEndingEventIndex)
      .forEach((event) => mutateLobbyStateSingleEvent(state, event));
    state.previousRoundSnapshot = undefined;
  });
  return produce(previousRoundSnapshot, (state) => {
    state.previousRoundSnapshot = previousRoundSnapshot;
    chainFrom(events)
      .drop(lastRoundEndingEventIndex)
      .forEach((event) => mutateLobbyStateSingleEvent(state, event));
  });
}

function mutateLobbyStateSingleEvent(
  state: LobbyState,
  event: LobbyEvent,
): void {
  function getPlayer(address: Address): Player {
    const player = state.playersByAddress.get(address);
    if (!player) {
      throw new Error("Unknown player address: " + address);
    }
    return player;
  }

  // Run this **before** setting the player order for the next round.
  function mutateIfFullyGuessedSecret(player: Player): void {
    if (player.fullyRevealedSecret === undefined) {
      return;
    }
    player.revealedSecrets.push(player.fullyRevealedSecret);
    player.livesLeft--;
    player.matchHistory = [];
    if (player.livesLeft === 0) {
      player.isEliminated = true;
      state.nextRoundPlayerSet.delete(player.address);
    }
  }

  function finishRound(): void {
    for (const player of state.playersByAddress.values()) {
      mutateIfFullyGuessedSecret(player);
      if (!state.nextRoundPlayerSet.has(player.address)) {
        player.isEliminated = true;
      }
      player.hasCommittedGuess = false;
      player.revealedGuess = undefined;
      player.hasRevealedMatches = false;
      player.fullyRevealedSecret = undefined;
    }
    state.currentRoundPlayerOrder = [...state.nextRoundPlayerSet];
    state.nextRoundPlayerSet.clear();
    state.roundNumber++;
  }

  switch (event.eventName) {
    case "LobbyCreated":
      return;
    case "JoinedLobby": {
      const { player, playerName } = event.args;
      state.playersByAddress.set(player, {
        address: player,
        name: playerName,
        score: 0,
        livesLeft: state.config.numLives,
        isEliminated: false,
        revealedSecrets: [],
        matchHistory: [],
        hasCommittedGuess: false,
        revealedGuess: undefined,
        hasRevealedMatches: false,
        fullyRevealedSecret: undefined,
      });
      state.nextRoundPlayerSet.add(player);
      return;
    }
    case "GameStarted":
      return;
    case "NewRound": {
      const { targetOffsets } = event.args;
      finishRound();
      state.targetOffsets = targetOffsets as number[];
      return;
    }
    case "NewPhase": {
      const { phase, deadline } = event.args;
      state.phase = phase;
      state.phaseDeadline = deadline * 1000;
      return;
    }
    case "GuessCommitted": {
      const { player } = event.args;
      getPlayer(player).hasCommittedGuess = true;
      return;
    }
    case "GuessRevealed": {
      const { player, guess } = event.args;
      getPlayer(player).revealedGuess = guess;
      return;
    }
    case "MatchesRevealed": {
      const {
        attacker: attackerAddress,
        defender: defenderAddress,
        guess,
        matches: rawMatches,
        newYellowCount,
        newGreenCount,
        pointsAwarded,
      } = event.args;
      // Differs from the backend logic by updating the player's current word
      // and removing them at the start of the next round instead of immediately
      // upon reveal if their word is fully guessed. This is because we want to
      // continue to show information about the current word and, unlike the
      // backend, the guesses are revealed in separate events for each attacker
      // instead of all in one transaction.
      const attacker = getPlayer(attackerAddress);
      attacker.score += pointsAwarded;
      const matches = rawMatches as unknown as Color[];
      const defender = getPlayer(defenderAddress);
      defender.hasRevealedMatches = true;
      defender.matchHistory.push({
        attacker: attackerAddress,
        guess,
        matches,
        newYellowCount,
        newGreenCount,
        pointsAwarded,
      });
      if (matches.every((color) => color === Color.GREEN)) {
        defender.fullyRevealedSecret = guess;
      }
      state.nextRoundPlayerSet.add(defenderAddress);
      return;
    }
    case "PlayerAdvancedWithNoAttackers": {
      const { player } = event.args;
      getPlayer(player).hasRevealedMatches = true;
      state.nextRoundPlayerSet.add(player);
      return;
    }
    case "SecretWordFound":
    case "PlayerEliminated":
      return;
    case "GameEnded": {
      finishRound();
      state.phase = Phase.GAME_OVER;
      return;
    }
    default:
      // "Assert never," check exhaustiveness.
      ((_: never) => 0)(event);
  }
}

export function getAttackers(state: LobbyState, defender: Address): Player[] {
  const defenderIndex = getPlayerIndex(state, defender);
  return state.targetOffsets.map((offset) =>
    getPlayerAtOffset(state, defenderIndex, -offset),
  );
}

export function getDefenders(state: LobbyState, attacker: Address): Player[] {
  const attackerIndex = getPlayerIndex(state, attacker);
  return state.targetOffsets.map((offset) =>
    getPlayerAtOffset(state, attackerIndex, offset),
  );
}

export function getPlayer(state: LobbyState, playerAddress: Address): Player {
  const player = state.playersByAddress.get(playerAddress);
  if (player === undefined) {
    throw new Error(
      "Lobby did not contain player with address: " + playerAddress,
    );
  }
  return player;
}

function getPlayerIndex(state: LobbyState, playerAddress: Address): number {
  const index = state.currentRoundPlayerOrder.indexOf(playerAddress);
  if (index === -1) {
    throw new Error("Player not in current round: " + playerAddress);
  }
  return index;
}

function getPlayerAtOffset(
  state: LobbyState,
  playerIndex: number,
  offset: number,
): Player {
  const numPlayers = state.currentRoundPlayerOrder.length;
  const address =
    state.currentRoundPlayerOrder[
      (playerIndex + numPlayers + offset) % numPlayers
    ];
  return getPlayer(state, address);
}

export function playerIsThinking(lobby: LobbyState, player: Player): boolean {
  if (player.isEliminated) {
    return false;
  }
  switch (lobby.phase) {
    case Phase.COMMITING_GUESSES:
      return !player.hasCommittedGuess;
    case Phase.REVEALING_GUESSES:
      return player.hasCommittedGuess && !player.revealedGuess;
    case Phase.REVEALING_MATCHES:
      return !player.hasRevealedMatches;
    case Phase.NOT_STARTED:
    case Phase.GAME_OVER:
      return false;
    default:
      // Assert never.
      throw ((_: never) => 0)(lobby.phase);
  }
}

export function getPlayersDoneWithPhaseCount(lobby: LobbyState): number {
  return chainFrom(lobby.currentRoundPlayerOrder)
    .map((address) => getPlayer(lobby, address))
    .filter((player) => !playerIsThinking(lobby, player))
    .count();
}

export function getLivePlayerCount(lobby: LobbyState): number {
  return lobby.currentRoundPlayerOrder.length;
}

function getLastRoundEndingEventIndex(
  events: LobbyEvent[],
): number | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    if (
      events[i].eventName === "NewRound" ||
      events[i].eventName === "GameEnded"
    ) {
      return i;
    }
  }
  return undefined;
}
