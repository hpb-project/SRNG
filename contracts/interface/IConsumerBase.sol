// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IConsumerBase {
    function responseRandom(bytes32 commit, bytes32 random) external returns (bool);
}