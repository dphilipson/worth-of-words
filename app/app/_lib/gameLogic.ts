import { produce } from "immer";
import { Address, Hex } from "viem";

import { LobbyEvent } from "./events";

export interface LobbyState {
  config: LobbyConfig;
  playersByAddress: Map<Address, Player>;
  currentRoundPlayerOrder: Address[];
  nextRoundPlayerSet: Set<Address>;
  targetOffsets: number[];
  roundNumber: number;
  currentPhase: Phase;
  phaseDeadline: number;
}

export interface Player {
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
    roundNumber: 0,
    currentPhase: Phase.NOT_STARTED,
    phaseDeadline: 0,
  };
}

export const getUpdatedLobbyState = produce(mutateLobbyState);

export function mutateLobbyState(
  state: LobbyState,
  events: LobbyEvent[],
): void {
  for (const event of events) {
    mutateLobbyStateSingleEvent(state, event);
  }
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
  function mutateIfFullyGuessedSecret(address: Address, player: Player): void {
    if (player.fullyRevealedSecret === undefined) {
      return;
    }
    player.revealedSecrets.push(player.fullyRevealedSecret);
    player.livesLeft--;
    if (player.livesLeft === 0) {
      player.isEliminated = true;
      state.nextRoundPlayerSet.delete(address);
    }
  }

  switch (event.eventName) {
    case "LobbyCreated":
      return;
    case "JoinedLobby": {
      const { player, playerName } = event.args;
      state.playersByAddress.set(player, {
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
      state.currentRoundPlayerOrder.push(player);
      return;
    }
    case "GameStarted":
      return;
    case "NewRound": {
      const { targetOffsets } = event.args;
      for (const [address, player] of state.playersByAddress) {
        mutateIfFullyGuessedSecret(address, player);
        if (!state.nextRoundPlayerSet.has(address)) {
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
      state.targetOffsets = targetOffsets as number[];
      return;
    }
    case "NewPhase": {
      const { phase, deadline } = event.args;
      state.currentPhase = phase;
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
        attacker,
        defender: defenderAddress,
        guess,
        matches: rawMatches,
        pointsAwarded,
      } = event.args;
      // Differs from the backend logic by updating the player's current word
      // and removing them at the start of the next round instead of immediately
      // upon reveal if their word is fully guessed. This is because we want to
      // continue to show information about the current word and, unlike the
      // backend, the guesses are revealed in separate events for each attacker
      // instead of all in one transaction.
      getPlayer(attacker).score += pointsAwarded;
      const matches = rawMatches as unknown as Color[];
      const defender = getPlayer(defenderAddress);
      defender.matchHistory.push({
        attacker,
        guess,
        matches,
      });
      if (matches.every((color) => color === Color.GREEN)) {
        defender.fullyRevealedSecret = guess;
      }
      state.nextRoundPlayerSet.add(defenderAddress);
      return;
    }
    case "SecretWordFound":
    case "PlayerEliminated":
      return;
    case "GameEnded": {
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
  const player = state.playersByAddress.get(address);
  if (player === undefined) {
    throw new Error("Player was in current round, but not in map: " + address);
  }
  return player;
}
