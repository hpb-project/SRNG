// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interface/IConsumerBase.sol";
import "../interface/IOracle.sol";
import "../common/Auth.sol";

contract ComsumerExample is IConsumerBase, Admin {
    uint256 _nrandom;

    address [] players;

    IOracle oracle = IOracle(0xd9145CCE52D386f254917e481eB44e9943F39138); // oracle address

    event GameWinner(address winner, uint256 block);

    function startNewGame() public onlyOwner {
        oracle.requestRandom(address(this));
    }

    function joinGame() public {
        players.push(msg.sender);
    }

    // responseRandom will 
    function responseRandom(bytes32 commit, bytes32 random) override public returns (bool) {
        _nrandom = uint256(random);
        return true;
    }

    function endGame() public onlyOwner {
        require(_nrandom != 0, "not got random");
        require(players.length > 0, "have no players");
        uint32 wineridx = uint32(_nrandom% players.length);
        emit GameWinner(players[wineridx], block.number);
    }
}