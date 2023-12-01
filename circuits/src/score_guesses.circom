pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "./hash2.circom";

/**
 * Takes in a word, salt, and several guesses, where the word and guesses are
 * represented as arrays of "letters," each letter being a number in [0, 26).
 * Outputs a commitment to the word and salt as well as a "score" for each
 * guess, with each score represented as an array that indicates, for each
 * letter in the guess, what kind of match that letter was.
 */
template ScoreGuesses(NumGuesses, NumLetters) {
  signal input word[NumLetters];
  signal input salt;
  signal input guesses[NumGuesses][NumLetters];
  signal output commitment;
  // Each element in a scores array is 0, 1, or 2 if letter in guess is…
  //   …not in word -> 0
  //   …in word at different position (yellow) -> 1
  //   …in word at correct position (green) -> 2
  signal output scores[NumGuesses][NumLetters];

  // Verify that hash(word, salt) == commitment.
  component wordToNumber = WordToNumber(NumLetters);
  wordToNumber.word <== word;

  component commitmentHasher = Hash2();
  commitmentHasher.ins[0] <== wordToNumber.number;
  commitmentHasher.ins[1] <== salt;
  commitment <== commitmentHasher.out;

  component scorers[NumGuesses];

  for (var i = 0; i < NumGuesses; i++) {
    scorers[i] = ScoreGuess(NumLetters);
    scorers[i].word <== word;
    scorers[i].guess <== guesses[i];
    scores[i] <== scorers[i].scores;
  }
}

template ScoreGuess(NumLetters) {
  signal input word[NumLetters];
  signal input guess[NumLetters];
  signal output scores[NumLetters];

  // Compute and verify the scores.
  component guessEqualsWord = EqualsByLetter(NumLetters);
  guessEqualsWord.ins[0] <== guess;
  guessEqualsWord.ins[1] <== word;

  component guessEqualsGuess = EqualsByLetter(NumLetters);
  guessEqualsGuess.ins[0] <== guess;
  guessEqualsGuess.ins[1] <== guess;

  component greens = Greens(NumLetters);
  greens.guessEqualsWord <== guessEqualsWord.out;

  component appearancesInWord = AppearancesInWord(NumLetters);
  appearancesInWord.guessEqualsWord <== guessEqualsWord.out;

  component leftAppearancesInGuess = LeftAppearancesInGuess(NumLetters);
  leftAppearancesInGuess.guessEqualsGuess <== guessEqualsGuess.out;

  component rightSameLetterGreens = RightSameLetterGreens(NumLetters);
  rightSameLetterGreens.greens <== greens.out;
  rightSameLetterGreens.guessEqualsGuess <== guessEqualsGuess.out;

  component yellows = Yellows(NumLetters);
  yellows.greens <== greens.out;
  yellows.appearancesInWord <== appearancesInWord.out;
  yellows.leftAppearancesInGuess <== leftAppearancesInGuess.out;
  yellows.rightSameLetterGreens <== rightSameLetterGreens.out;

  for (var i = 0; i < NumLetters; i++) {
    scores[i] <== 2 * greens.out[i] + yellows.out[i];
  }
}

// Interprets an array of "letters" as a base-26 number.
template WordToNumber(NumLetters) {
  signal input word[NumLetters];
  signal output number;
  signal acc[NumLetters];
  for (var i = 0; i < NumLetters; i++) {
    acc[i] <== i == 0 ? word[0] : 26 * acc[i - 1] + word[i];
  }
  number <== acc[NumLetters - 1];
}

// Returns out[i][j] is true if ins[0][i] == ins[1][j].
template EqualsByLetter(NumLetters) {
  signal input ins[2][NumLetters];
  signal output out[NumLetters][NumLetters];
  component equals[NumLetters][NumLetters];
  for (var i = 0; i < NumLetters; i++) {
    for (var j = 0; j < NumLetters; j++) {
      equals[i][j] = IsEqual();
      equals[i][j].in[0] <== ins[0][i];
      equals[i][j].in[1] <== ins[1][j];
      out[i][j] <== equals[i][j].out;
    }
  }
}

// Returns out[i] = true if guess[i] is green.
template Greens(NumLetters) {
  signal input guessEqualsWord[NumLetters][NumLetters];
  signal output out[NumLetters];
  for (var i = 0; i < NumLetters; i++) {
    out[i] <== guessEqualsWord[i][i];
  }
}

// For each letter of the guess, counts how many times that letter appears in
// the word.
template AppearancesInWord(NumLetters) {
  signal input guessEqualsWord[NumLetters][NumLetters];
  signal output out[NumLetters];
  component sums[NumLetters];
  for (var i = 0; i < NumLetters; i++) {
    sums[i] = MultiSum(NumLetters);
    for (var j = 0; j < NumLetters; j++) {
      sums[i].ins[j] <== guessEqualsWord[i][j];
    }
    out[i] <== sums[i].out;
  }
}

// For each letter of the guess, counts how many times that letter appears in
// the guess to the left of it.
template LeftAppearancesInGuess(NumLetters) {
  signal input guessEqualsGuess[NumLetters][NumLetters];
  signal output out[NumLetters];
  component sums[NumLetters];
  for (var i = 0; i < NumLetters; i++) {
    sums[i] = MultiSum(NumLetters);
    for (var j = 0; j < NumLetters; j++) {
      sums[i].ins[j] <== j < i ? guessEqualsGuess[i][j] : 0;
    }
    out[i] <== sums[i].out;
  }
}

// For each letter of the guess, counts how many times that letter appears in
// the guess as a green to the right of it.
template RightSameLetterGreens(NumLetters) {
  signal input greens[NumLetters];
  signal input guessEqualsGuess[NumLetters][NumLetters];
  signal output out[NumLetters];
  component sums[NumLetters];
  for (var i = 0; i < NumLetters; i++) {
    sums[i] = MultiSum(NumLetters);
    for (var j = 0; j < NumLetters; j++) {
      // Multiplication is AND.
      sums[i].ins[j] <== j > i ? greens[j] * guessEqualsGuess[i][j] : 0;
    }
    out[i] <== sums[i].out;
  }
}

function numBits(x) {
  var n = 1;
  var exp = 0;
  while (n <= x) {
    exp++;
    n *= 2;
  }
  return exp;
}

template Yellows(NumLetters) {
  signal input greens[NumLetters];
  signal input appearancesInWord[NumLetters];
  signal input leftAppearancesInGuess[NumLetters];
  signal input rightSameLetterGreens[NumLetters];
  signal output out[NumLetters];
  component lessThans[NumLetters];
  // A yellow is a letter which is:
  // - not a green
  // - #(leftAppearancesInGuess) + #(rightSameLetterGreens) < #(appearancesInWord)
  for (var i = 0; i < NumLetters; i++) {
    lessThans[i] = LessThan(numBits(NumLetters));
    lessThans[i].in[0] <== leftAppearancesInGuess[i] + rightSameLetterGreens[i];
    lessThans[i].in[1] <== appearancesInWord[i];
    // 1 - x is NOT(x), multiplication is AND.
    out[i] <== (1 - greens[i]) * lessThans[i].out;
  }
}

template MultiSum(N) {
  signal input ins[N];
  signal output out;
  signal acc[N];
  for (var i = 0; i < N; i++) {
    acc[i] <== i == 0 ? ins[0] : acc[i - 1] + ins[i];
  }
  out <== acc[N - 1];
}

component main {public [guesses]} = ScoreGuesses(3, 5);