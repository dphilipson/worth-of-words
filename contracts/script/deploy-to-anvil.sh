#!/usr/bin/env bash

set -ex

forge script script/DeployToAnvil.s.sol:DeployToAnvilScript --fork-url http://localhost:8545 --broadcast -vvvv
mkdir -p ../app/app/_lib/generated/
cp out/anvilConstants.ts ../app/app/_generated/