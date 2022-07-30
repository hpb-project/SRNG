// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

interface IOracle {
    function requestRandom(address,address,bytes32) external returns (bool);
    function commit(bytes32) external ;
    function getRandom(bytes32, bytes memory) external view returns (bytes32);
}

contract ComsumerExample {
    // 用于控制合约私有操作的权限
    address private _owner;
    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    IOracle oracle = IOracle(0x800B5105b31bD100bE85E8646f86EA263aDB1786); // oracle contract address

    constructor(address _oracle) {
	    oracle = IOracle(_oracle);
	    _owner = msg.sender; // 将合约的部署者设置为 owner
    }
    //constructor() {
    //        _owner = msg.sender; // 将合约的部署者设置为 owner
    //}
    
    uint256 _nrandom;       // 用于存储随机数


    // 合约业务逻辑，存储参与游戏的用户.
    address [] players;     
    
    // 开始比赛，私有操作，只能合约owner调用
    function startNewGame(bytes32 token) public onlyOwner {      
        // 请求随机数. 第一个参数为交易发起者，第二个参数为当前合约地址.
        oracle.requestRandom(msg.sender, address(this), token);
    }

    // 合约业务逻辑，任何用户都可以参加游戏
    function joinGame() public {
        players.push(msg.sender);
    }

    // 合约业务逻辑，当获得了随机数后，结束比赛，并使用随机数计算获胜者.
    function endGame(bytes32 commit, bytes memory signature) public onlyOwner {
        bytes32 random = oracle.getRandom(commit, signature);
        _nrandom = uint256(random);
	console.log("Consumer contract get random");
	console.logBytes32(random);
        
        require(_nrandom != 0, "not got random");
        require(players.length > 0, "have no players");
        uint32 wineridx = uint32(_nrandom% players.length);
        emit GameWinner(players[wineridx], block.number);
    }
    
    event GameWinner(address winner, uint256 block); // 合约业务事件
}
