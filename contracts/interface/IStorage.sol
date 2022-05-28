// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../common/Commit.sol";

interface IStorage {
    function checkExist(bytes32) external returns (bool);
    function addNewCommit(address, Commit memory ) external;
    function getCommit(bytes32 hash) external view returns (Commit memory);
    function getUserUnverifiedCommits(address) external view returns (Commit [] memory);
    function updateCommitSubscribe(bytes32, address) external;
    function updateCommitUnSubscribe(bytes32, address) external;
    function updateCommitVerified(address, bytes32, bytes32) external;
    function updateCommitConsumed(address, bytes32, bytes32) external;
    function findCommit() external view returns (bool, Commit memory) ;
    function subscribeCommit(address,bytes32) external;
    function unsubscribeCommit(address, bytes32) external;
}
