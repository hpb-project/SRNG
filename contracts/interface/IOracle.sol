// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOracle {
    function requestRandom(address,address, bytes32) external returns (bytes32);
    function getRandom(bytes32, bytes memory) external view returns (bytes32);
}
