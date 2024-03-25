#!/usr/bin/env bash

# Not -x. That would print the sensitive env vars to console.
set -e

# https://stackoverflow.com/a/246128/2695248
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
CONTRACTS_DIR=${SCRIPT_DIR}/..

cd $CONTRACTS_DIR

source .env
forge script script/DeployForReal.s.sol:DeployForRealScript --rpc-url $OPTIMISM_SEPOLIA_RPC_URL --broadcast --verify -vvvv
mkdir -p ../app/app/_generated/
cp out/deployedConstants.ts ../app/app/_generated/