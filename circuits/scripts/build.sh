#!/usr/bin/env bash

set -ex

POT_16=pot16_final.ptau

build_circuit() {
  CIRCUIT_NAME=$1
  CONTRACT_NAME=$2
  circom src/$CIRCUIT_NAME.circom --r1cs --wasm --sym -o dist
  ZKEY_000=dist/${CIRCUIT_NAME}_0000.zkey
  npx snarkjs groth16 setup dist/$CIRCUIT_NAME.r1cs $POT_16 $ZKEY_000
  ZKEY=dist/${CIRCUIT_NAME}.zkey
  npx snarkjs zkey contribute $ZKEY_000 $ZKEY --name="1st Contributor Name" -v
  npx snarkjs zkey export solidityverifier $ZKEY dist/${CIRCUIT_NAME}_verifier.sol
  rm $ZKEY_000
  mkdir -p ../app/public/generated
  cp dist/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm ../app/public/generated/
  cp $ZKEY ../app/public/generated/
  CONTRACTS_PATH=../contracts/src/generated
  mkdir -p $CONTRACTS_PATH
  DEST_NAME=$CONTRACTS_PATH/${CONTRACT_NAME}Verifier.sol
  cp dist/${CIRCUIT_NAME}_verifier.sol $DEST_NAME
  sed -i "" "s/Groth16Verifier/${CONTRACT_NAME}Verifier/g" $DEST_NAME
  sed -i "" "s/verifyProof/verify${2}Proof/g" $DEST_NAME
  sed -i "" "s/constant/private constant/g" $DEST_NAME
}

rm -rf dist/*
build_circuit valid_word ValidWord
build_circuit score_guess ScoreGuess
cp dist/valid_word_js/witness_calculator.js ../app/app/_generated/

