// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interface/IStorage.sol";
import "../interface/IConsumerBase.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";

// oracle is use to receive all request and find random to consumer.
contract Oracle is Admin {
    IStorage store;

    function requestRandom(address consumer) public returns (bool) {
        IConsumerBase con = IConsumerBase(consumer);
        Commit memory commit = store.findCommit();
        con.responseRandom(commit);

    }

}