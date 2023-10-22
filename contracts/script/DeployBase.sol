// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Script, console2} from "forge-std/Script.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {MinionAccountFactory} from "../src/MinionAccountFactory.sol";
import {WorthOfWords} from "../src/WorthOfWords.sol";

contract DeployBase is Script {
    IEntryPoint constant ENTRY_POINT =
        IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    function runWithPrivateKey(uint256 deployerPrivateKey) internal {
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
