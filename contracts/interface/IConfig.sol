// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IConfig {
    function getFee() external view returns (uint256);
    function getMaxUnverify() external view returns (uint256);
    function getDepositAmount() external view returns (uint256);
    function getUnSubBlocks() external view returns (uint256);
    function getMinVerifyBlocks() external view returns (uint256);
    function getMaxVerifyBlocks() external view returns (uint256);
}
