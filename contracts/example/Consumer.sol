// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOracle {
    function requestRandom(address,address,bytes32) external returns (bool);
    function getRandom(bytes32) external view returns (bytes32);
}

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ComsumerExample {
    // 用于控制合约私有操作的权限
    address private _owner;
    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    IOracle oracle = IOracle(0xC64a38A3F84ec773F0c8F33C190FeB850F2b52d2); // oracle contract address
    IERC20 token = IERC20(0xecd36A108570F04cb2175d3D52A9653BA90557fc);  // hrg token contract address

    constructor() {
	    _owner = msg.sender; // 将合约的部署者设置为 owner
    }

    // 更新合约地址
    function setting(address oracleAddr, address tokenAddr) public onlyOwner {
        oracle = IOracle(oracleAddr);
        token = IERC20(tokenAddr);
    }
    
    uint256 _nrandom;       // 用于存储随机数

    // 合约业务逻辑，存储参与游戏的用户.
    address [] players;     

    // 授权oracle可以收取hrg手续费
    function approveToken(uint256 amount) public onlyOwner {
        uint8 dec = token.decimals();
        uint256 towei = amount * 10 ** dec;
        require(token.balanceOf(address(this)) >= towei, "not enough token");
        token.approve(address(oracle), towei);
    }
    
    // 开始比赛，私有操作，只能合约owner调用
    function startNewGame(string memory ring) public onlyOwner {
        bytes32 ringhash = keccak256(bytes(ring));
        // 请求随机数. 第一个参数为交易发起者，第二个参数为当前合约地址.
        oracle.requestRandom(msg.sender, address(this), ringhash);
    }

    // 合约业务逻辑，任何用户都可以参加游戏
    function joinGame() public {
        players.push(msg.sender);
    }

    // 合约业务逻辑，当获得了随机数后，结束比赛，并使用随机数计算获胜者.
    function endGame(bytes32 commit) public onlyOwner {
        bytes32 random = oracle.getRandom(commit);
        _nrandom = uint256(random);
    	
        require(_nrandom != 0, "not got random");
        require(players.length > 0, "have no players");
        uint32 wineridx = uint32(_nrandom% players.length);
        emit GameWinner(players[wineridx], block.number);
    }
    
    event GameWinner(address winner, uint256 block); // 合约业务事件
}
