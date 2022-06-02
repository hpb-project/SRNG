// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOracle {
    function requestRandom(address,address) external returns (bool);
}
