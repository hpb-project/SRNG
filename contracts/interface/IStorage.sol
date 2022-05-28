// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../common/Commit.sol";

interface IStorage {
    function checkExist(bytes32) external returns (bool);
    function addNewCommit(address, Commit memory ) external;
    function getCommit(bytes32 hash) external returns (Commit memory);
    function getUserUnverifiedCommits(address) external returns (Commit [] memory);
    function updateCommitSubscribe(bytes32, address) external;
    function updateCommitUnSubscribe(bytes32, address) external;
    function updateCommitVerified(address, bytes32, bytes32) external;
    function updateCommitConsumed(address, bytes32, bytes32) external;
    function subscribeCommit(address) external returns (bytes32);
    function unsubscribeCommit(address, bytes32) external;
}
