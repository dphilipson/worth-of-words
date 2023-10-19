import { produce } from "immer";
import { Address } from "viem";

import { LobbyEvent } from "./logs";

export interface LobbyState {
  config: LobbyConfig;
  playersByAddress: Map<Address, Player>;
  currentRoundPlayerOrder: Address[];
  nextRoundPlayerSet: Set<Address>;
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
  privateGamePublicKey: string;
  minPlayers: number;
  maxPlayers: number;
  guessWordMerkleRoot: string;
  maxCommitGuessTime: number;
  maxRevealGuessTime: number;
  maxRevealMatchesTime: number;
  maxRounds: number;
  numLives: number;
  pointsForYellow: number;
  pointsForGreen: number;
  pointsForFullWord: number;
}

export const getUpdatedLobbyState = produce(mutateLobbyState);

function mutateLobbyState(state: LobbyState, events: LobbyEvent[]): void {
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
      // TODO: add guess and matches into the defender's history.
      // add points to the attacker.
      // Add the defender into next round's stuff if they're not eliminated.
      // DON'T advance the defender to the next word if it's fully guessed: we still need
      // to display the old one while other people guess against it.
      // So where do we remove their word? We'll have to do it in round started, which
      // differs from the backend logic, which removes it upon reveal.
      // How do we tell if a player is eliminated in the round start transition? We can check the
      // three most recent things in their match history and see if any are full green.
      // (we need to do that word-advancement logic in GameEnded too).

      // Problem. We get multiple MatchesRevealed for a single defender.
      // If none of them eliminate the defender we want to add them to the next round.
      // but we need them added to the next round in the order that these matches were revealed.
      // we could add them all to the set, then remove them if their word is revealed.
      // okay, that's the plan.

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
