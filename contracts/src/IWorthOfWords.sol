// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

type LobbyId is uint256;
type Word is uint24;

struct LobbyConfig {
    // Sandwich the fields used for setup between the two merkle root
    // fields. This ensures the fields used for gameplay start at the start
    // of a slot and all fit into a single slot.
    uint256 secretWordMerkleRoot;
    /**
     * 0 for a public game.
     */
    bytes20 privateGamePublicKey;
    uint32 minPlayers;
    uint32 maxPlayers;
    bytes32 guessWordMerkleRoot;
    uint32 maxCommitGuessTime;
    uint32 maxRevealGuessTime;
    uint32 maxRevealMatchesTime;
    /**
     * 0 for no round limit.
     */
    uint8 maxRounds;
    uint8 numLives;
    uint8 pointsForYellow;
    uint8 pointsForGreen;
    uint8 pointsForFullWord;
}

enum Phase {
    NotStarted,
    CommittingGuesses,
    RevealingGuesses,
    RevealingMatches,
    GameOver
}

enum Color {
    Gray,
    Yellow,
    Green
}

struct ValidWordsProof {
    uint256[2] _pA;
    uint256[2][2] _pB;
    uint256[2] _pC;
    /**
     * Public signals are [...commitments[3], merkleRoot].
     */
    uint256[4] _pubSignals;
}

struct ScoreGuessesProof {
    uint256[2] _pA;
    uint256[2][2] _pB;
    uint256[2] _pC;
    /**
     * Public signals are [commitment, ...scores[3][5], ...guessLetters[3][5]].
     */
    uint256[31] _pubSignals;
}

interface WorthOfWordsTypes {
    event LobbyCreated(LobbyId indexed lobbyId, address indexed creator);
    event JoinedLobby(
        LobbyId indexed lobbyId,
        address indexed player,
        string playerName
    );
    event GameStarted(LobbyId indexed lobbyId, uint32 playerCount);
    event NewRound(
        LobbyId indexed lobbyId,
        uint32 roundNumber,
        uint32[] targetOffsets,
        uint32 remainingPlayerCount
    );
    event NewPhase(
        LobbyId indexed lobbyId,
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
        address indexed attacker,
        address indexed defender,
        string guess,
        Color[5] matches,
        uint32 newYellowCount,
        uint32 newGreenCount,
        uint32 pointsAwarded
    );
    event PlayerAdvancedWithNoAttackers(
        LobbyId indexed lobbyId,
        address indexed player
    );
    event SecretWordFound(
        LobbyId indexed lobbyId,
        address indexed player,
        string word,
        uint32 secretWordIndex
    );
    event PlayerEliminated(LobbyId indexed lobbyId, address indexed player);
    event GameEnded(LobbyId indexed lobbyId);

    // General-purpose errors.
    error LobbyDoesNotExist();
    error PlayerNotInLobby();
    error PlayerIsEliminated();
    error WrongPhase(Phase attemptedPhase, Phase currentPhase);

    // Errors for createLobby
    error MissingSecretWordMerkleRoot();
    error MissingGuessWordMerkleRoot();
    error MaxPlayerCountTooLow();
    error PlayerCountRangeIsEmpty();
    error NumLivesIsZero();
    error TooManyLives();

    // Errors for joinLobby.
    error AlreadyInLobby();
    error LobbyIsFull(uint32 playerLimit);
    error IncorrectLobbyPassword();
    error InvalidSecretWordsProof();
    error InvalidMerkleProofInSecretWordsProof();

    // Errors for startGame.
    error NotHost(address host);
    error NotEnoughPlayers(uint32 currentPlayers, uint32 requiredPlayers);

    // Errors for commitGuess (none).

    // Errors for revealGuess.
    error NoGuessCommitted();
    error GuessDoesNotMatchCommitment(bytes32 commitment);
    error InvalidMerkleProofInGuessReveal();

    // Errors for revealMatches.
    error WrongSecretWordOrSaltInMatchProof(
        uint32 attackerIndex,
        uint32 secretWordIndex,
        string guess
    );
    error WrongGuessInMatchProof(uint32 attackerIndex, string requiredGuess);
    error InvalidMatchProof();

    // Errors for endRevealMatchesPhase.
    error DeadlineNotExpired(uint48 currentTime, uint48 deadline);
}

interface IWorthOfWords is WorthOfWordsTypes {
    function createLobby(
        LobbyConfig calldata config
    ) external returns (LobbyId);

    function joinLobby(
        LobbyId lobbyId,
        string calldata playerName,
        bytes calldata password,
        ValidWordsProof calldata secretWordsCommitment
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
        ScoreGuessesProof calldata proof
    ) external;

    function endRevealMatchesPhase(LobbyId lobbyId) external;

    function getLobbyConfig(
        LobbyId lobbyId
    ) external view returns (LobbyConfig memory);

    function isValidLobbyPassword(
        LobbyId lobbyId,
        bytes calldata password
    ) external view returns (bool);
}
