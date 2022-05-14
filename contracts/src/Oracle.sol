// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IStorage.sol";
import "../interface/IConsumerBase.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";

// oracle is use to receive all request and find random to consumer.
contract Oracle is Admin {
    IStorage store;
    IERC20   hrgtoken;
    IConfig  config;

    constructor (address _token, address _config) {
        hrgtoken = IERC20(_token);
        config = IConfig(_config);
    }

    function requestRandom(address consumer) public returns (bool) {
        bytes32 commit = store.findCommit(consumer);
        require(uint256(commit) != uint256(0), "Oracle::Not fund commit");
        return true;
    }

}