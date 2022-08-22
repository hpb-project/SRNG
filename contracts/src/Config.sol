// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../common/Auth.sol";

contract Config is Admin {
    uint256 _fee = 1.5 ether;
    uint256 _max_unverify = 10; // max unverified record per committer
    uint256 _max_veirfi_block = 400; // max verify blocks from commit
    uint256 _min_veirfi_block = 0; // min verify blocks from commit
    uint256 _deposit_amount = 1 ether;
    uint256 _unsub_blocks = 200; // max block count from subscribe to unsubscribe.
    address _oracle; // oracle contract address.

    event updateoracle(address old, address newaddr);
    
    constructor() {
		addAdmin(msg.sender);
	}
    
    function setOracle(address neworacle) public onlyAdmin {
        address old = _oracle;
        _oracle = neworacle;
        emit updateoracle(old, _oracle);
    }

    function getOracle() public view returns (address) {
        return _oracle;
    }    

    function setFee(uint256 newfee) public onlyAdmin {
        _fee = newfee;
    }

    function getFee() public view returns (uint256) {
        return _fee;
    }
    function setMaxUnverify(uint256 max_unverify) public onlyAdmin {
        _max_unverify = max_unverify;
    }

    function getMaxUnverify() public view returns (uint256) {
        return _max_unverify;
    }

    function setDepositAmount(uint256 amount) public onlyAdmin {
        _deposit_amount = amount;
    }

    function getDepositAmount() public view returns (uint256) {
        return _deposit_amount;
    }

    function setUnSubBlocks(uint256 blocks) public onlyAdmin {
        _unsub_blocks = blocks;
    }

    function getUnSubBlocks() public view returns (uint256) {
        return _unsub_blocks;
    }

    function setMinVerifyBlocks(uint256 blocks) public onlyAdmin {
        _min_veirfi_block = blocks;
    }

    function getMinVerifyBlocks() public view returns (uint256) {
        return _min_veirfi_block;
    }

    function setMaxVerifyBlocks(uint256 blocks) public onlyAdmin {
        _max_veirfi_block = blocks;
    }

    function getMaxVerifyBlocks() public view returns (uint256) {
        return _max_veirfi_block;
    }

}
