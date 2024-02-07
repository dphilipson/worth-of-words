// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Script} from "forge-std/Script.sol";
import {BaseDeploy} from "./BaseDeploy.sol";

contract DeployForRealScript is BaseDeploy {
    function run() external {
        runWithPrivateKey(
            vm.envUint("PRIVATE_KEY"),
            "deployedConstants.ts",
            "DEPLOYED",
            true
        );
    }
}
