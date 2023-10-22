#!/usr/bin/env bash

source .env
forge script script/DeployForReal.s.sol:DeployForRealScript --rpc-url $MUMBAI_RPC_URL --broadcast --verify -vvvv