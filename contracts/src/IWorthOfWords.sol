// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

interface IWorthOfWords {
    type LobbyId is uint256;
    type Word is uint24;

    struct LobbyConfig {
        uint256 secretWordMerkleRoot;
        bytes32 guessWordMerkleRoot;
        /**
         * 0 for a public game.
         */
        bytes20 privateGamePublicKey;
        uint32 minPlayers;
        uint32 maxPlayers;
        uint32 maxCommitGuessTime;
        uint32 maxRevealGuessTime;
        uint32 maxRevealMatchesTime;
        uint8 numLives;
        /**
         * 0 for no round limit.
         */
        uint8 maxRounds;
        uint8 pointsForYellow;
        uint8 pointsForGreen;
        uint8 pointsForFullWord;
        uint8 pointPenaltyForLosingLife;
        uint8 pointsForDroppedOpponent;
    }

    struct LobbyState {
        PlayerInfo[] players;
        Phase currentPhase;
        uint8 roundNumber;
        uint48 phaseDeadline;
    }

    enum Phase {
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
        Color[5] matches;
    }

    enum Color {
        Gray,
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

    struct MatchesLog {
        address guesser;
        string guess;
        Color[5] matches;
    }

    event LobbyCreated(LobbyId indexed lobbyId, address indexed creator);
    event JoinedLobby(
        LobbyId indexed lobbyId,
        address indexed player,
        string playerName
    );
    event GameStarted(LobbyId indexed lobbyId, uint32 playerCount);
    event NewRound(
        LobbyId indexed,
        uint32 roundNumber,
        uint32[] targetOffsets,
        uint32 remainingPlayerCount
    );
    event NewPhase(
        LobbyId indexed,
        Phase indexed phase,
        uint32 roundNumber,
        uint48 deadline
    );
    event GuessCommitted(
        LobbyId indexed lobbyId,
        address indexed player,
        uint32 currentScore
    );
    event GuessRevealed(
        LobbyId indexed lobbyId,
        address indexed player,
        string guess
    );
    event MatchesRevealed(
        LobbyId indexed lobbyId,
        address indexed player,
        MatchesLog[] matches
    );
    event SecretWordFound(
        LobbyId indexed lobbyId,
        address indexed player,
        string word,
        uint256 livesLeft
    );
    event PlayerEliminated(
        LobbyId indexed lobbyId,
        address indexed player,
        uint256 finalScore
    );
    event UnrevealedPlayersEliminated(
        LobbyId indexed lobbyId,
        address indexed caller,
        uint256 eliminatedPlayerCount
    );
    event GameEnded(LobbyId indexed lobbyId, address indexed winner);

    // General-purpose errors.
    error LobbyDoesNotExist();
    error PlayerNotInLobby();
    error PlayerIsEliminated();
    error WrongPhase(Phase attemptedPhase, Phase currentPhase);

    // Errors for createLobby
    error MissingSecretWordMerkleRoot();
    error MissingGuessWordMerkleRoot();
    error MinPlayerCountTooLow();
    error PlayerCountRangeIsEmpty();
    error NumLivesIsZero();

    // Errors for joinLobby.
    error AlreadyInLobby();
    error LobbyIsFull(uint32 playerLimit);
    error IncorrectLobbyPassword();
    error WrongNumberOfSecretWords(uint32 provided, uint32 required);
    error InvalidSecretWordProof(uint32 proofIndex);

    // Errors for startGame.
    error NotEnoughPlayers(uint32 currentPlayers, uint32 requiredPlayers);

    // Errors for commitGuess (none).

    // Errors for revealGuess.
    error InvalidGuessReveal();
    error GuessIsNotAWord();

    // Errors for revealMatches.
    error InvalidMatchProof();

    // Errors for startNewRound.
    error DeadlineNotExpired(uint48 currentTime, uint48 deadline);

    function createLobby(
        LobbyConfig calldata config
    ) external returns (LobbyId);

    function joinLobby(
        LobbyId lobbyId,
        string calldata playerName,
        bytes32 password,
        ValidWordProof[] calldata secretWordCommitments
    ) external;

    function startGame(LobbyId lobbyId) external;

    function commitGuess(LobbyId lobbyId, bytes32 commitment) external;

    function revealGuess(
        LobbyId lobbyId,
        Word guess,
        uint256 salt,
        bytes32[] calldata merkleProof
    ) external;

    function revealMatches(
        LobbyId lobbyId,
        ScoreGuessProof[] calldata proofs
    ) external;

    function startNewRound(LobbyId lobbyId) external;

    function getLobbyConfig(
        LobbyId lobbyId
    ) external view returns (LobbyConfig memory);

    function getLobbyState(
        LobbyId lobbyId
    ) external view returns (LobbyState memory);

    // TODO: expose method for getting opponents for round?
}
