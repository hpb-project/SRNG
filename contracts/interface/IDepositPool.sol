// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDepositPool {
    function deposit(address user, uint256 amount) external;
    function withdraw(address user, uint256 amount) external;
    function reward(address user, uint256 amount) external;
    function rewardFee(address commiter, uint256 amount) external;
    function getRewards() external view returns (uint256);

}
