#!/usr/bin/env bash

set -ex

build_circuit() {
  CIRCUIT_NAME=$1
  CONTRACT_NAME=$2
  circom src/$CIRCUIT_NAME.circom --r1cs --wasm --sym -o dist
  npx snarkjs groth16 setup dist/$CIRCUIT_NAME.r1cs pot16_final.ptau dist/${CIRCUIT_NAME}_0000.zkey
  npx snarkjs zkey contribute dist/${CIRCUIT_NAME}_0000.zkey dist/${CIRCUIT_NAME}.zkey --name="1st Contributor Name" -v
  npx snarkjs zkey export solidityverifier dist/${CIRCUIT_NAME}.zkey dist/${CIRCUIT_NAME}_verifier.sol
  rm dist/${CIRCUIT_NAME}_0000.zkey
  mkdir -p ../app/public/generated
  cp dist/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm ../app/public/generated/
  cp dist/${CIRCUIT_NAME}.zkey ../app/public/generated/
  mkdir -p ../contracts/src/generated
  sed "s/Groth16Verifier/${CONTRACT_NAME}Verifier/g" dist/${CIRCUIT_NAME}_verifier.sol > ../contracts/src/generated/${CONTRACT_NAME}Verifier.sol
}

rm -rf dist/*
build_circuit valid_word ValidWord
build_circuit score_guess ScoreGuess
cp dist/valid_word_js/witness_calculator.js ../app/app/_generated/

