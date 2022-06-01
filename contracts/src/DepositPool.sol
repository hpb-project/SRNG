pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IConsumerBase.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";

contract DepositPool is Admin {
    IERC20 hrgToken;
    address commiter;
    modifier onlyCommiter() {
        require(msg.sender==commiter, "only commiter could do it");
        _;
    }
    
    constructor(address token, address _commiter) {
        hrgToken = IERC20(token);
        commiter = _commiter;
		addAdmin(msg.sender);
    }

    function deposit(address user, uint256 amount) public onlyCommiter {
        hrgToken.transferFrom(user, address(this), amount);
    }

    function withdraw(address user, uint256 amount) public onlyCommiter {
        hrgToken.transfer(user, amount);
    }

    function reward(address user, uint256 amount) public onlyCommiter {
        hrgToken.transfer(user, amount);
    }

    function rewardFee(address commiter, uint256 amount) public onlyCommiter {
        hrgToken.transfer(commiter, amount);
    }
}