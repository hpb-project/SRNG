// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStat {
    function addUnVerified(address committer) external returns (uint256);
    function getUnVerified(address committer) external view returns (uint256);
    
    function addVerifiedCommit(address commiter) external;

    function addConsumedCommit(address commiter, address consumer) external;

    function getCommiterValidCount(address commiter) external view returns (uint256);

    function getConsumerConsumedCount(address consumer) external view returns (uint256);

    function getTotalStat() external view returns (uint256, uint256, uint256);
}
