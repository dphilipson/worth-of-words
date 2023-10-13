#!/usr/bin/env bash

set -ex

compile_only() {
  CIRCUIT_NAME=$1
  circom src/$CIRCUIT_NAME.circom --r1cs --wasm --sym -o dist
}

compile_only valid_word
compile_only score_guess

