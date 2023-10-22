// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {BaseAccount} from "account-abstraction/core/BaseAccount.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {UserOperation} from "account-abstraction/interfaces/UserOperation.sol";

/**
 * An ERC-4337 account which can do nothing other than make calls to a single
 * contract or send eth to its owner.
 *
 * It validates its signatures using ECDSA, but note that the private key for
 * signatures is **not** the same as the owner's private key. This account's
 * private key should be considered expendable and never be used to protect
 * anything of significant value.
 */
contract MinionAccount is BaseAccount, Initializable {
    IEntryPoint private immutable _entryPoint;
    address public immutable target;
    address public owner;
    address public publicKey;

    event MinionAccountInitialized(
        IEntryPoint indexed entryPoint,
        address indexed target,
        address indexed owner
    );

    error CallerNotOwnerOrEntryPoint();

    modifier onlyOwnerOrEntryPoint() {
        _onlyOwnerOrEntryPoint();
        _;
    }

    constructor(IEntryPoint entryPoint_, address target_) {
        _entryPoint = entryPoint_;
        target = target_;
    }

    receive() external payable {}

    fallback(
        bytes calldata data
    ) external onlyOwnerOrEntryPoint returns (bytes memory) {
        (bool success, bytes memory result) = target.call(data);
        if (!success) {
            _rethrowError(result);
        }
        return bytes("");
    }

    function initialize(
        address owner_,
        address publicKey_
    ) external payable initializer {
        owner = owner_;
        publicKey = publicKey_;
        emit MinionAccountInitialized(_entryPoint, target, owner_);
    }

    function withdraw(uint256 value) external onlyOwnerOrEntryPoint {
        (bool success, bytes memory result) = owner.call{value: value}(
            bytes("")
        );
        if (!success) {
            _rethrowError(result);
        }
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        if (publicKey != ECDSA.recover(hash, userOp.signature))
            return SIG_VALIDATION_FAILED;
        return 0;
    }

    function _onlyOwnerOrEntryPoint() private view {
        if (msg.sender != address(_entryPoint) && msg.sender != owner) {
            revert CallerNotOwnerOrEntryPoint();
        }
    }

    function _rethrowError(bytes memory result) private pure {
        assembly {
            revert(add(result, 32), mload(result))
        }
    }
}
