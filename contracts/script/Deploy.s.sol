// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Script, console2} from "forge-std/Script.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {MinionAccountFactory} from "../src/MinionAccountFactory.sol";
import {WorthOfWords} from "../src/WorthOfWords.sol";
import {DeployBase} from "./DeployBase.sol";

contract DeployScript is DeployBase {
    // Anvil key 0.
    uint256 constant ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        runWithPrivateKey(ANVIL_PRIVATE_KEY);
    }
}
