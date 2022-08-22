// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRNG {
    function getBlockRandom() external view returns (bytes32);
}
