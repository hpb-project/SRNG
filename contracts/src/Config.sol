// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../common/Auth.sol";

contract Config is Admin {
    uint256 _max_unverify = 10; // max unverified record per committer
    uint256 _deposit_amount = 100 ether;
    uint256 _unsub_blocks = 200; // max block count from subscribe to unsubscribe.
    
    constructor() {
		addAdmin(msg.sender);
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
}
