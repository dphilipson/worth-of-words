// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {IPaymaster} from "account-abstraction/interfaces/IPaymaster.sol";
import {UserOperation} from "account-abstraction/interfaces/UserOperation.sol";

/**
 * Debug paymaster which always approves requests.
 */
contract DevPaymaster is IPaymaster {
    function validatePaymasterUserOp(UserOperation calldata, bytes32, uint256)
    external override returns (bytes memory, uint256) {}

    function postOp(PostOpMode, bytes calldata, uint256) external override {}
}