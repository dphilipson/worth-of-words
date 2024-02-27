#!/usr/bin/env bash

set -ex

# https://stackoverflow.com/a/246128/2695248
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
CONTRACTS_DIR=${SCRIPT_DIR}/..

FACTORY_OWNER=0xddf32240b4ca3184de7ec8f0d5aba27dec8b7a5c

cd $CONTRACTS_DIR

# 10 eth
cast rpc anvil_setBalance $FACTORY_OWNER 0x8ac7230489e80000
cast rpc anvil_impersonateAccount $FACTORY_OWNER
forge script script/DeployToAnvil.s.sol:DeployToAnvilScript \
  --broadcast \
  --fork-url http://localhost:8545 \
  --sender $FACTORY_OWNER \
  --unlocked
cast rpc anvil_stopImpersonatingAccount $FACTORY_OWNER
mkdir -p ../app/app/_generated/
cp out/anvilConstants.ts ../app/app/_generated/