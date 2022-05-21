// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IConfig {
    function getRewards() external view returns (uint256);
    function getFee() external view returns (uint256);
    function getMaxUnverify() external view returns (uint256);
    function getDepositAmount() external view returns (uint256);
}
