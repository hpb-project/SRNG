// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Commit {
    // fields for commit.
    address     author;
    bytes32 	commit;
    uint256		block;  // commit block
    bytes32     hrandom; // real random in block when commit.

    // fields for verify.
    bytes32		seed;   // verified seed.
    bool 		revealed;   // finish verified.
    uint256     verifiedBlock; // verified block.

    // fields for consume.
    address     consumer;
    address     subsender;
    uint256     subBlock; // subscribe block.
    uint8       substatus; // 0: not used 1: in subcribe 2: commiter finished
}