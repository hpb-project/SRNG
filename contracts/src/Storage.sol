// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../common/Auth.sol";
import "../common/Commit.sol";

contract Storage is Admin {
    mapping(bytes32 => Commit) CommitPool;
    mapping(bytes32 => Commit) HistoryCommits;
    
    function findCommit() public returns (Commit memory) {
        
    }
}