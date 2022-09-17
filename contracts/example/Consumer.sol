// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOracle {
    function requestRandom(address,address,bytes32) external returns (bytes32);
    function getRandom(bytes32) external view returns (bytes32);
}
interface IConfig {
    function getOracle() external view returns (address);
}

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
    address private _owner;
    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    IConfig config = IConfig(0x62794Fb2C86CD5401bf2bcA327C2F178Ce1bda88);
    IERC20 token = IERC20(0xAf0dB00D59F31C8bD9eEff61F1D26EF82C5cDA15);  // hrg token contract address
    
    constructor() {
            _owner = msg.sender;
    }

    function setting(address configaddr, address tokenAddr) public onlyOwner {
        config = IConfig(configaddr);
        token = IERC20(tokenAddr);
    }
    
    bytes32 _random;
    bytes32 _subcommit;
    address [] players;
    address winer;

    // approve token to oracle.
    function approveToken(uint256 amount) public onlyOwner {
        uint8 dec = token.decimals();
        uint256 towei = amount * 10 ** dec;
        require(token.balanceOf(address(this)) >= towei, "not enough token");
        address oracleaddr = config.getOracle();
        token.approve(oracleaddr, towei);
    }
    
    // request a random.
    function startNewGame() public onlyOwner {
        bytes32 ringhash = keccak256(bytes("something"));
        address oracleaddr = config.getOracle();
        _subcommit = IOracle(oracleaddr).requestRandom(msg.sender, address(this), ringhash);
        require(uint256(_subcommit)!=uint256(0), "request random empty");
    }

    function joinGame() public {
        players.push(msg.sender);
    }

    function endGame() public onlyOwner {
        address oracleaddr = config.getOracle();
        _random = IOracle(oracleaddr).getRandom(_subcommit);
        uint256 _nrandom = uint256(_random);
    
        require(_nrandom != 0, "not got random");
        require(players.length > 0, "have no players");
        uint32 wineridx = uint32(_nrandom% players.length);
        winer = players[wineridx];

    }
    
    function getrandom() public view onlyOwner returns (bytes32) {
        return _random;
    }
}
