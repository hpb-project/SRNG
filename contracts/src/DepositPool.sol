pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IConsumerBase.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";

contract DepositPool is Admin {
    IERC20 hrgToken;
    constructor(address token) {
        hrgToken = IERC20(token);
		addAdmin(msg.sender);
    }

    function deposit(address user, uint256 amount) public {
        hrgToken.transferFrom(user, address(this), amount);
    }

    function withdraw(address user, uint256 amount) public {
        hrgToken.transfer(user, amount);
    }

    function reward(address user, uint256 amount) public {
        hrgToken.transfer(user, amount);
    }

    function rewardFee(address commiter, uint256 amount) public {
        hrgToken.transfer(commiter, amount);
    }
}