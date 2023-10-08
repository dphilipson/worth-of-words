pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/gates.circom";
include "./hash2.circom";

/**
 * Takes in a word, salt, and guess, where the word and guess are represented
 * as arrays of "letters," each letter being a number in [0, 26). Outputs a
 * commitment to the word and salt as well as "scores", an array that indicates,
 * for each letter in the guess, what kind of match that letter was.
 */
template ScoreGuess(NumLetters) {
    signal input word[NumLetters];
    signal input salt;
    signal input guess[NumLetters];
    signal output commitment;
    // Each element in scores array is 0, 1, or 2 if letter in guess is…
    //   …not in word -> 0
    //   …in word at different position -> 1
    //   …in word at correct position -> 2
    signal output scores[NumLetters];

    // Verify that hash(word, salt) == commitment.
    component wordToNumber = WordToNumber(NumLetters);
    wordToNumber.word <== word;
    component commitmentHasher = Hash2();
    commitmentHasher.ins[0] <== wordToNumber.number;
    commitmentHasher.ins[1] <== salt;
    commitment <== commitmentHasher.out;

    // Compute and verify the scores.
    component ors[NumLetters];
    component equals[NumLetters][NumLetters];
    for (var i = 0; i < NumLetters; i++) {
      ors[i] = MultiOr(NumLetters);
      for (var j = 0; j < NumLetters; j++) {
        equals[i][j] = IsEqual();
        equals[i][j].in[0] <== guess[i];
        equals[i][j].in[1] <== word[j];
        ors[i].ins[j] <== equals[i][j].out;
      }
      scores[i] <== ors[i].out + equals[i][i].out;
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

template MultiOr(n) {
  signal input ins[n];
  signal output out;
  // De Morgan's Law over a MultiAND circuit.
  component and = MultiAND(n);
  component nots[n];
  for (var i = 0; i < n; i++) {
    nots[i] = NOT();
    nots[i].in <== ins[i];
    and.in[i] <== nots[i].out;
  }
  component not = NOT();
  not.in <== and.out;
  out <== not.out;
}

component main {public [guess]} = ScoreGuess(5);