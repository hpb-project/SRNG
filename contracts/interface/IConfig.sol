// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IConfig {
    function GetRewards() external returns (uint256);
    function GetFee() external returns (uint256);
}
