#!/usr/bin/env bash

set -ex

FACTORY_OWNER=0xddf32240b4ca3184de7ec8f0d5aba27dec8b7a5c

# 10 eth
cast rpc anvil_setBalance $FACTORY_OWNER 0x8ac7230489e80000
cast rpc anvil_impersonateAccount $FACTORY_OWNER
forge script script/DeployToAnvil.s.sol:DeployToAnvilScript \
  --broadcast \
  --fork-url http://localhost:8545 \
  --sender $FACTORY_OWNER \
  --unlocked
cast rpc anvil_stopImpersonatingAccount $FACTORY_OWNER
mkdir -p ../app/app/generated/
cp out/anvilConstants.ts ../app/app/_generated/