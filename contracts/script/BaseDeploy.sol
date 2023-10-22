// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {Script, console2} from "forge-std/Script.sol";
import {MinionAccountFactory} from "../src/MinionAccountFactory.sol";
import {WorthOfWords} from "../src/WorthOfWords.sol";

contract BaseDeploy is Script {
    IEntryPoint private constant ENTRY_POINT =
        IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    function runWithPrivateKey(
        uint256 privateKey,
        string memory outFilename,
        string memory variablePrefix
    ) internal {
        vm.startBroadcast(privateKey);
        address worthOfWords = deployWorthOfWords();
        address factory = deployMinionFactory(worthOfWords);
        string memory path = string.concat("./out/", outFilename);
        if (vm.exists(path)) {
            vm.removeFile(path);
        }
        vm.writeLine(path, "// Generated by forge deploy script");
        vm.writeLine(
            path,
            string.concat(
                "export const ",
                variablePrefix,
                '_WORTH_OF_WORDS_ADDRESS = "',
                vm.toString(worthOfWords),
                '";'
            )
        );
        vm.writeLine(
            path,
            string.concat(
                "export const ",
                variablePrefix,
                '_MINION_FACTORY_ADDRESS = "',
                vm.toString(factory),
                '";'
            )
        );
        console2.log("WorthOfWords: %s", worthOfWords);
        console2.log("MinionAccountFactory: %s", factory);
        vm.stopBroadcast();
    }

    function deployWorthOfWords() private returns (address) {
        address addr = Create2.computeAddress(
            bytes32(0),
            keccak256(
                abi.encodePacked(type(WorthOfWords).creationCode, abi.encode())
            ),
            CREATE2_FACTORY
        );
        if (addr.code.length > 0) {
            return addr;
        }
        address worthOfWords = address(new WorthOfWords{salt: 0}());
        require(
            worthOfWords == addr,
            "WorthOfWords address did not match predicted"
        );
        return worthOfWords;
    }

    function deployMinionFactory(
        address worthOfWords
    ) private returns (address) {
        address addr = Create2.computeAddress(
            bytes32(0),
            keccak256(
                abi.encodePacked(
                    type(MinionAccountFactory).creationCode,
                    abi.encode(ENTRY_POINT, worthOfWords)
                )
            ),
            CREATE2_FACTORY
        );
        if (addr.code.length > 0) {
            return addr;
        }
        address factory = address(
            new MinionAccountFactory{salt: 0}(ENTRY_POINT, worthOfWords)
        );
        require(
            factory == addr,
            "MinionAccountFactory address did not match predicted"
        );
        return factory;
    }
}
