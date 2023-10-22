#!/usr/bin/env bash

# Not -x. That would print the sensitive env vars to console.
set -e

source .env
forge script script/DeployForReal.s.sol:DeployForRealScript --rpc-url $MUMBAI_RPC_URL --broadcast --verify -vvvv
mkdir -p ../app/app/_lib/generated/
cp out/deployedConstants.ts ../app/app/_generated/