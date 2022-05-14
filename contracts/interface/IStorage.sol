// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../common/Commit.sol";

interface IStorage {
    function findCommit(address) external returns (bytes32);
}
