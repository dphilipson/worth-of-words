// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Script, console2} from "forge-std/Script.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {MinionAccountFactory} from "../src/MinionAccountFactory.sol";
import {WorthOfWords} from "../src/WorthOfWords.sol";
import {DeployBase} from "./DeployBase.sol";

contract DeployForRealScript is DeployBase {
    function run() external {
        runWithPrivateKey(vm.envUint("PRIVATE_KEY"));
    }
}
