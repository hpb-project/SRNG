// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IConsumerBase.sol";
import "../common/Auth.sol";

contract Stats is Admin {
    mapping(address => uint256) committers; // mapping committer address and valid commit count.
    mapping(address => uint256) consumers;  // mapping consumer address and consumed random count.
    mapping(address => uint256) unverifiedCommit; // mapping committer address and unverified commit count.

    uint256 totalCommitters;
    uint256 totalConsumers;
    uint256 totalConsumedCommit;
    address _commiter;

    modifier onlyCommiter() {
        require(msg.sender==_commiter, "only commiter could do it");
        _;
    }

    constructor(address commiter) {
        _commiter = commiter;
		addAdmin(msg.sender);
	}

    function addUnVerified(address committer) public onlyCommiter returns (uint256) {
        unverifiedCommit[committer] = unverifiedCommit[committer] + 1;
        return unverifiedCommit[committer];
    }

    function getUnVerified(address committer) public view returns (uint256) {
        return unverifiedCommit[committer];
    }

    function addVerifiedCommit(address commiter) public onlyCommiter {
        require(unverifiedCommit[commiter] > 0, "have no unverified commit");

        if (committers[commiter] == 0) {
            committers[commiter] = 1;
            totalCommitters = totalCommitters + 1;
        } else {
            committers[commiter] = committers[commiter] + 1;
        }

        unverifiedCommit[commiter] = unverifiedCommit[commiter] - 1;
    }

    function addConsumedCommit(address commiter, address consumer) public onlyCommiter {
        if (consumers[consumer] == 0) {
            consumers[consumer] = 1;
            totalConsumers = totalConsumers + 1;
        } else {
            consumers[consumer] = consumers[consumer] + 1;
        }
        totalConsumedCommit = totalConsumedCommit + 1;
    }

    function getCommiterValidCount(address commiter) public view returns (uint256) {
        return committers[commiter];
    }

    function getConsumerConsumedCount(address consumer) public view returns (uint256) {
        return consumers[consumer];
    }

    function getTotalStat() public view returns (uint256, uint256, uint256) {
        return (totalCommitters, totalConsumers, totalConsumedCommit);
    }
}