// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Script} from "forge-std/Script.sol";
import {BaseDeploy} from "./BaseDeploy.sol";

contract DeployToAnvilScript is BaseDeploy {
    // Anvil key 0.
    uint256 private constant ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        runWithPrivateKey(ANVIL_PRIVATE_KEY, "anvilConstants.ts", "ANVIL", false);
    }
}
