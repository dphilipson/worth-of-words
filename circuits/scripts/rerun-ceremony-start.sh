#!/usr/bin/env bash

set -ex

POWER=16

npx snarkjs powersoftau new bn128 $POWER pot${POWER}_0000.ptau -v
npx snarkjs powersoftau contribute pot${POWER}_0000.ptau pot${POWER}_0001.ptau --name="First contribution" -v
npx snarkjs powersoftau prepare phase2 pot${POWER}_0001.ptau pot${POWER}_final.ptau -v
rm pot${POWER}_0000.ptau pot${POWER}_0001.ptau