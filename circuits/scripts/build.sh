#!/usr/bin/env bash

set -ex

build_circuit() {
  CIRCUIT_NAME=$1
  circom src/$CIRCUIT_NAME.circom --r1cs --wasm --sym -o dist
  npx snarkjs groth16 setup dist/$CIRCUIT_NAME.r1cs pot16_final.ptau dist/${CIRCUIT_NAME}_0000.zkey
  npx snarkjs zkey contribute dist/${CIRCUIT_NAME}_0000.zkey dist/${CIRCUIT_NAME}.zkey --name="1st Contributor Name" -v
  npx snarkjs zkey export solidityverifier dist/${CIRCUIT_NAME}.zkey dist/${CIRCUIT_NAME}_verifier.sol
  rm dist/${CIRCUIT_NAME}_0000.zkey
  mkdir -p ../app/public/generated
  cp dist/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm ../app/public/generated/
  cp dist/${CIRCUIT_NAME}.zkey ../app/public/generated/
  mkdir -p ../contracts/src/generated
  cp dist/${CIRCUIT_NAME}_verifier.sol ../contracts/src/generated
}

rm -rf dist/*
build_circuit valid_word
build_circuit score_guess

