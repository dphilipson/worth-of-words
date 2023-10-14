// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

type LobbyId is uint256;
type Word is uint24;

struct LobbyConfig {
    uint256 secretWordMerkleRoot;
    bytes32 guessWordMerkleRoot;
    /**
     * 0 for a public game.
     */
    bytes32 privateGamePublicKey;
    uint32 minPlayers;
    uint32 maxPlayers;
    uint32 maxCommitGuessTime;
    uint32 maxRevealGuessTime;
    uint32 maxRevealMatchesTime;
    uint8 numLives;
    uint8 maxRounds;
}

struct LobbyState {
    PlayerInfo[] players;
    LobbyStatus status;
    uint8 roundNumber;
    uint48 roundDeadline;
}

enum LobbyStatus {
    NotStarted,
    CommittingGuesses,
    RevealingGuesses,
    RevealingMatches,
    GameOver
}

struct PlayerInfo {
    address playerAddress;
    string name;
    PlayerStatus status;
    uint256 score;
    string[] revealedWords;
    Guess[] currentWordGuesses;
}

enum PlayerStatus {
    PhaseIncomplete,
    PhaseComplete,
    Eliminated
}

struct Guess {
    string word;
    LetterMatch[5] matches;
}

enum LetterMatch {
    Grey,
    Yellow,
    Green
}

struct ValidWordProof {
    uint256[2] _pA;
    uint256[2][2] _pB;
    uint256[2] _pC;
    uint256[2] _pubSignals;
}

struct ScoreGuessProof {
    uint256[2] _pA;
    uint256[2][2] _pB;
    uint256[2] _pC;
    uint256[11] _pubSignals;
}

error LobbyDoesNotExist(LobbyId);

interface IWorthOfWords {
    function createLobby(
        LobbyConfig calldata config
    ) external returns (LobbyId);

    function joinLobby(
        LobbyId lobbyId,
        string calldata playerName,
        bytes32 password,
        ValidWordProof[] calldata secretWordCommitments
    ) external;

    function commitGuess(LobbyId lobbyId, bytes32 commitment) external;

    function revealGuess(LobbyId lobbyId, Word guess, uint256 salt) external;

    function revealMatches(
        LobbyId lobbyId,
        ScoreGuessProof calldata proof
    ) external;

    function eliminateUnrevealedPlayers(LobbyId lobbyId) external;

    function getLobbyConfig(
        LobbyId lobbyId
    ) external view returns (LobbyConfig memory);

    function getLobbyState(
        LobbyId lobbyId
    ) external view returns (LobbyState memory);

    // TODO: expose method for getting opponents for round?
}
