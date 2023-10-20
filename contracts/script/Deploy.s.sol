// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {WorthOfWords} from "../src/WorthOfWords.sol";

contract DeployScript is Script {
    function run() public {
        // Anvil key 0.
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);
        WorthOfWords worthOfWords = new WorthOfWords();
        console2.log("WorthOfWords: %s", address(worthOfWords));
        vm.stopBroadcast();
    }
}
