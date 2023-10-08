pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/mimcsponge.circom";

template Hash2() {
    signal input ins[2];
    signal output out;

    component commitmentMimc = MiMCSponge(2, 220, 1);
    commitmentMimc.ins[0] <== ins[0];
    commitmentMimc.ins[1] <== ins[1];
    commitmentMimc.k <== 7;
    out <== commitmentMimc.outs[0];
}
