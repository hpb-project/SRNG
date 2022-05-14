// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Auth.sol";

contract Config is Admin {
    uint256 _rewards = 0.1 ether;
    uint256 _fee = 0.1 ether;
    
    function SetFee(uint256 newfee) public onlyAdmin {
        _fee = newfee;
    }

    function GetFee() public returns (uint256) {
        return _fee;
    }

    function SetRewards(uint256 reward) public onlyAdmin {
        _rewards = reward;
    }

    function GetRewards() public returns (uint256) {
        return _rewards;
    }
}