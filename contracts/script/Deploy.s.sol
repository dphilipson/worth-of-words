// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {MinionAccountFactory} from "../src/MinionAccountFactory.sol";
import {WorthOfWords} from "../src/WorthOfWords.sol";

contract DeployScript is Script {
    IEntryPoint constant ENTRY_POINT =
        IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    function run() public {
        // Anvil key 0.
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);
        WorthOfWords worthOfWords = new WorthOfWords();
        MinionAccountFactory factory = new MinionAccountFactory(
            ENTRY_POINT,
            address(worthOfWords)
        );
        console2.log("WorthOfWords: %s", address(worthOfWords));
        console2.log("MinionAccountFactory: %s", address(factory));
        vm.stopBroadcast();
    }
}
