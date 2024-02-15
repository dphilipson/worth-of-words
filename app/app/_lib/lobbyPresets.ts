import { Hex, zeroAddress } from "viem";

import { LobbyConfig } from "./gameLogic";
import { getGuessWordMerkleTree, getSecretWordMerkleTree } from "./merkle";

export const POINTS_FOR_YELLOW = 2;
export const POINTS_FOR_GREEN = 5;
export const POINTS_FOR_FULL_WORD = 10;

export enum GameSpeed {
  FAST = "fast",
  FULL = "full",
}

export interface GameSpeedConstants {
  guessMinutes: number;
  numLives: number;
}

export const GAME_SPEED_CONSTANTS: Record<GameSpeed, GameSpeedConstants> = {
  [GameSpeed.FAST]: { guessMinutes: 2, numLives: 2 },
  [GameSpeed.FULL]: { guessMinutes: 4, numLives: 3 },
};

export async function getLobbyPreset(speed: GameSpeed): Promise<LobbyConfig> {
  const [secretTree, guessTree] = await Promise.all([
    getSecretWordMerkleTree(),
    getGuessWordMerkleTree(),
  ]);
  const secretWordMerkleRoot = secretTree.root;
  const guessWordMerkleRoot = guessTree.root as Hex;
  const { guessMinutes, numLives } = GAME_SPEED_CONSTANTS[speed];
  return {
    secretWordMerkleRoot,
    privateGamePublicKey: zeroAddress,
    minPlayers: 0,
    maxPlayers: 10000,
    guessWordMerkleRoot,
    maxCommitGuessTime: 60 * guessMinutes,
    maxRevealGuessTime: 30,
    maxRevealMatchesTime: 30,
    maxRounds: 0,
    numLives,
    pointsForYellow: POINTS_FOR_YELLOW,
    pointsForGreen: POINTS_FOR_GREEN,
    pointsForFullWord: POINTS_FOR_FULL_WORD,
  };
}

export function getSpeedFromConfig(config: LobbyConfig): GameSpeed | undefined {
  return (Object.keys(GAME_SPEED_CONSTANTS) as GameSpeed[]).find((speed) => {
    const { guessMinutes, numLives } = GAME_SPEED_CONSTANTS[speed];
    return (
      config.maxCommitGuessTime === 60 * guessMinutes &&
      config.numLives === numLives
    );
  });
}
