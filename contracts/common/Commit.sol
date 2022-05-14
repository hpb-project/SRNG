// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Commit {
    address     author;
    address     consumer;
    bytes32 	commit;
    bytes32		seed;
    uint64 		block;
    bool 		revealed;
    uint8       status; // 0: not used 1: in subcribe 2: commiter finished
}