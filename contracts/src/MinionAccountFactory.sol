// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {MinionAccount} from "./MinionAccount.sol";

contract MinionAccountFactory {
    MinionAccount public immutable accountImplementation;

    constructor(IEntryPoint entryPoint, address target) {
        accountImplementation = new MinionAccount(entryPoint, target);
    }

    function createAccount(
        address publicKey
    ) external payable returns (MinionAccount minion) {
        minion = MinionAccount(
            payable(
                Clones.cloneDeterministic(
                    address(accountImplementation),
                    bytes32(uint256(uint160(msg.sender)))
                )
            )
        );
        minion.initialize{value: msg.value}(msg.sender, publicKey);
    }

    function getAddress(address owner) public view returns (address) {
        return
            Clones.predictDeterministicAddress(
                address(accountImplementation),
                bytes32(uint256(uint160(owner)))
            );
    }

    function hasDeployed(address owner) external view returns (bool) {
        return getAddress(owner).code.length > 0;
    }
}
