// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../common/Auth.sol";
import "../common/Commit.sol";

contract Storage is Admin {
    
    mapping(bytes32 => Commit) CommitPool;          // all unverified commit
    mapping(bytes32 => Commit) HistoryCommits;

    function addNewCommit(address commiter, Commit memory commit) public {
        bytes32 hash = commit.commit;
        require(CommitPool[hash].block == 0, "commit has exist");
        CommitPool[hash] = commit;
    }

    function updateCommit() public {

    }

    function _commitVerified() public {

    }

    function _commitConsumed() public {
        
    }
    
    function findCommit(address consumer) public returns (bytes32 ) {
        // todo: implement find commit in pool.
        bytes32 k = keccak256(abi.encodePacked(consumer));
        CommitPool[k].consumer = consumer;
        CommitPool[k].status = 1; // in subscribe.

        return k;
    }
}