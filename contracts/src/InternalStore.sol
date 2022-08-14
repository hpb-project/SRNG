// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../common/Auth.sol";

contract InternalStore is Admin {
    mapping(bytes32 => bytes32) SuberToken;          // commithash ==> suber token hash

    address _oracle;
    modifier onlyOracle() {
        require(msg.sender==_oracle, "only oracle could do it");
        _;
    }

    constructor(address oracle) {
        _oracle = oracle;
		addAdmin(msg.sender);
	}
    
    function setAddress(address oracle) public onlyAdmin {
        _oracle = oracle;
    }

    function addSubtoken(bytes32 commit, bytes32 token) public onlyOracle returns (bool) {
        require(SuberToken[commit] == bytes32(0), "commit already exist");
        SuberToken[commit] = token;
        return true;
    }

    function rmSubtoken(bytes32 commit) public onlyOracle returns (bool) {
        SuberToken[commit] = bytes32(0);
        return true;
    }

    function getSubtoken(bytes32 commit) public view onlyOracle returns (bytes32) {
        return SuberToken[commit];
    }
}