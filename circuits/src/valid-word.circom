pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/mimcsponge.circom";
include "../../node_modules/circomlib/circuits/switcher.circom";


template ValidWord(NLevels) {
    signal input word;
    signal input salt;
    signal input proofHashes[NLevels];
    signal input proofOrderings[NLevels];
    signal output commitment;
    signal output merkleRoot;

    // Verify that hash(word, salt) == commitment.
    component commitmentMimc = MiMCSponge(2, 220, 1);
    commitmentMimc.ins[0] <== word;
    commitmentMimc.ins[1] <== salt;
    commitmentMimc.k <== 7;
    commitment <== commitmentMimc.outs[0];

    // Verify that word is in the Merkle tree.
    component hashers[NLevels];
    component switchers[NLevels];
    levelHashes[0] <== word;
    for (i = 0; i < NLevels; i++) {
      switchers[i] = Switcher();
      switchers[i].sel <== proofOrderings[i];
      switchers[i].L <== i == 0 ? word : hashers[i - 1].outs[0];
      switchers[i].R <== proofHashes[i];
      hashers[i] = MiMCSponge(2, 220, 1);
      hashers[i].ins[0] <== switchers[i].outL;
      hashers[i].ins[1] <== switchers[i].outR;
      hashers[i].k <== 7;
    }
    merkleRoot <== hashers[NLevels - 1].outs[0];

}

component main = ValidWord(12);