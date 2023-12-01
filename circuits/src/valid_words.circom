pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/switcher.circom";
include "./hash2.circom";

/**
 * Takes several words, each represented the number obtained by interpreting
 * its letters in base-26), a salt, Merkle Root. Then for each word, takes
 * a Merkle proof and outputs a commitment to the word and
 * 
 * Each Merkle proof is represented as a list of hashes as well as a list of
 * booleans, where each boolean indicates in what order the accumulated hash
 * should be hashed together with the next step of the proof. A 0 indicates
 * the accumulated hash should be the left input to the next hash, while 1
 * indicates it should be the right.
 */
template ValidWords(NumWords, NumLevels) {
  signal input words[NumWords];
  signal input salt;
  signal input proofHashes[NumWords][NumLevels];
  signal input proofOrderings[NumWords][NumLevels];
  signal input merkleRoot;
  signal output commitments[NumWords];

  component validators[NumWords];

  for (var i = 0; i < NumWords; i++) {
    validators[i] = ValidWord(NumLevels);
    validators[i].word <== words[i];
    validators[i].salt <== salt;
    validators[i].proofHashes <== proofHashes[i];
    validators[i].proofOrderings <== proofOrderings[i];
    validators[i].merkleRoot <== merkleRoot;
    commitments[i] <== validators[i].commitment;
  }
}


template ValidWord(NumLevels) {
  signal input word;
  signal input salt;
  signal input proofHashes[NumLevels];
  signal input proofOrderings[NumLevels];
  signal input merkleRoot;
  signal output commitment;

  // Verify that hash(word, salt) == commitment.
  component commitmentHasher = Hash2();
  commitmentHasher.ins[0] <== word;
  commitmentHasher.ins[1] <== salt;
  commitment <== commitmentHasher.out;

  // Verify that word is in the Merkle tree.
  component hashers[NumLevels];
  component switchers[NumLevels];
  for (var i = 0; i < NumLevels; i++) {
    switchers[i] = Switcher();
    switchers[i].sel <== proofOrderings[i];
    switchers[i].L <== i == 0 ? word : hashers[i - 1].out;
    switchers[i].R <== proofHashes[i];
    hashers[i] = Hash2();
    hashers[i].ins[0] <== switchers[i].outL;
    hashers[i].ins[1] <== switchers[i].outR;
  }
  merkleRoot === hashers[NumLevels - 1].out;
}

component main {public [merkleRoot]} = ValidWords(3, 12);