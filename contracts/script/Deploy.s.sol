// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";

contract DeployScript is Script {
    function run() public {
        // Anvil key 0.
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);
        // ScoreGuessVerifier guessVerifier = new ScoreGuessVerifier{salt: 0}();
        // ValidWordVerifier validVerifier = new ValidWordVerifier{salt: 0}();
        // console2.log("ScoreGuessVerifier: %s", address(guessVerifier));
        // console2.log("ValidWordVerifier: %s", address(validVerifier));
        vm.stopBroadcast();
    }
}
