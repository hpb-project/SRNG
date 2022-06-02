pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IConsumerBase.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";

contract DepositPool is Admin {
    IERC20 hrgToken;
    address commiter;

    uint256 _rewards = 100 ether;
    uint256 _fee = 150 ether;

    uint256 mintSupply = 500000000 ether;
    uint256 minted = 0;

    modifier onlyCommiter() {
        require(msg.sender==commiter, "only commiter could do it");
        _;
    }
    
    constructor(address token, address _commiter) {
        hrgToken = IERC20(token);
        commiter = _commiter;
		addAdmin(msg.sender);
    }

    function setFee(uint256 newfee) public onlyAdmin {
        _fee = newfee;
    }

    function getFee() public view returns (uint256) {
        return _fee;
    }

    function _calcReward(uint256 minted) internal view returns (uint256) {
        uint256 half = mintSupply/2;
        uint256 r = _rewards;
        for (;minted >= half;) {
            half = half + half/2;
            r = r/2; 
        }
        return r;
    }

    function getRewards(uint256 minted) public view returns (uint256) {
        return _calcReward(minted);
    }

    function deposit(address user, uint256 amount) public onlyCommiter {
        hrgToken.transferFrom(user, address(this), amount);
    }

    function withdraw(address user, uint256 amount) public onlyCommiter {
        hrgToken.transfer(user, amount);
    }

    function reward(address user, uint256 amount) public onlyCommiter {
        hrgToken.transfer(user, amount);
        minted += amount;
    }

    function rewardFee(address _commiter, uint256 amount) public onlyCommiter {
        hrgToken.transfer(_commiter, amount);
    }
}