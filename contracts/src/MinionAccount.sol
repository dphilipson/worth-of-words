// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

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

    event PublicKeyChanged(
        address indexed previousPublicKey,
        address indexed newPublicKey
    );

    error InvalidOwner(address owner);
    error InvalidPublicKey(address publicKey);
    error UnauthorizedCaller(address caller);

    modifier onlyOwnerOrEntryPoint() {
        if (msg.sender != address(_entryPoint) && msg.sender != owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    constructor(IEntryPoint entryPoint_, address target_) {
        _entryPoint = entryPoint_;
        target = target_;
        _disableInitializers();
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
        if (owner_ == address(0)) {
            revert InvalidOwner(owner_);
        }
        _changePublicKey(publicKey_);
        emit MinionAccountInitialized(_entryPoint, target, owner_);
    }

    function withdraw(uint256 value) external onlyOwnerOrEntryPoint {
        uint256 cappedValue = _min(value, address(this).balance);
        (bool success, bytes memory result) = owner.call{value: cappedValue}(
            bytes("")
        );
        if (!success) {
            _rethrowError(result);
        }
    }

    function changePublicKey(address newPublicKey) external onlyOwner {
        _changePublicKey(newPublicKey);
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

    function _changePublicKey(address newPublicKey) internal {
        if (newPublicKey == address(0)) {
            revert InvalidPublicKey(newPublicKey);
        }
        address oldPublicKey = publicKey;
        publicKey = newPublicKey;
        emit PublicKeyChanged(oldPublicKey, newPublicKey);
    }

    function _rethrowError(bytes memory result) private pure {
        assembly {
            revert(add(result, 32), mload(result))
        }
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
