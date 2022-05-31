// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interface/IConsumerBase.sol";
import "../interface/IOracle.sol";
import "../common/Auth.sol";

contract ComsumerExample is IConsumerBase, Admin {
    uint256 _nrandom;

    IOracle oracle = IOracle(0xd9145CCE52D386f254917e481eB44e9943F39138); // oracle address

    function startNewGame() public onlyOwner {
        oracle.requestRandom(address(this));
    }

    // responseRandom will 
    function responseRandom(bytes32 commit, bytes32 random) override public returns (bool) {
        _nrandom = uint256(random);
        return true;
    }

}