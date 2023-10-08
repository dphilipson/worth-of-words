pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/switcher.circom";
include "./hash2.circom";

/**
 * Takes a word (represented the number obtained by interpreting its letters in
 * base-26), salt, and Merkle proof, and outputs a commitment to the word and
 * salt as well as the Merkle root corresponding to the proof.
 * 
 * The Merkle proof is represented as a list of hashes as well as a list of
 * booleans, where each boolean indicates in what order the accumulated hash
 * should be hashed together with the next step of the proof. A 0 indicates
 * the accumulated hash should be the left input to the next hash, while 1
 * indicates it should be the right.
 */
template ValidWord(NLevels) {
    signal input word;
    signal input salt;
    signal input proofHashes[NLevels];
    signal input proofOrderings[NLevels];
    signal output commitment;
    signal output merkleRoot;

    // Verify that hash(word, salt) == commitment.
    component commitmentHasher = Hash2();
    commitmentHasher.ins[0] <== word;
    commitmentHasher.ins[1] <== salt;
    commitment <== commitmentHasher.out;

    // Verify that word is in the Merkle tree.
    component hashers[NLevels];
    component switchers[NLevels];
    for (var i = 0; i < NLevels; i++) {
      switchers[i] = Switcher();
      switchers[i].sel <== proofOrderings[i];
      switchers[i].L <== i == 0 ? word : hashers[i - 1].out;
      switchers[i].R <== proofHashes[i];
      hashers[i] = Hash2();
      hashers[i].ins[0] <== switchers[i].outL;
      hashers[i].ins[1] <== switchers[i].outR;
    }
    merkleRoot <== hashers[NLevels - 1].out;

}

component main = ValidWord(12);