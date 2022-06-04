// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IStorage.sol";
import "../interface/IConsumerBase.sol";
import "../interface/ICommitReveal.sol";
import "../interface/IDepositPool.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";
import "../interface/IStat.sol";
import "hardhat/console.sol";

// oracle is use to receive all request and find random to consumer.
contract Oracle is Admin {
    IStorage store;
    IERC20   hrgtoken;
    IConfig  config;
    ICommitReveal   commitReveal;
    IDepositPool 	tokenPool;
    IStat   stat;
    constructor() {
		addAdmin(msg.sender);
	}

    function setting(address _token, address _config, address _deposit, address _store, address _commitReveal, address _stat) public onlyAdmin {
        hrgtoken = IERC20(_token);
        config = IConfig(_config);
        tokenPool = IDepositPool(_deposit);
        store = IStorage(_store);
        commitReveal = ICommitReveal(_commitReveal);
        stat = IStat(_stat);
    }

    // sender is user, consumer is contract address to use random.
    function requestRandom(address user, address consumer) public returns (bool) {
        bool find;
        Commit memory info;
        (find, info) = store.findCommit();
        require(find == true, "Oracle::Not fund commit");
        commitReveal.subScribeCommit(user, consumer, info.commit);
        emit Subscribe(consumer, info.author, info.commit, block.number, block.timestamp);
        return true;
    }
    event Subscribe(address consumer, address commiter, bytes32 hash, uint256 block, uint256 time);

    function unsubscribeRandom(address consumer, bytes32 hash) public {
        Commit memory info = store.getCommit(hash);
        require(info.substatus == 1, "commit not subscribe");
        uint256 unsubBlocks = config.getUnSubBlocks();
        require((info.subBlock + unsubBlocks) >= block.number, "out of unsub max blockx");

        commitReveal.unSubscribeCommit(consumer, hash);
        emit UnSubscribe(consumer, info.author, hash, block.number, block.timestamp);
    }
    event UnSubscribe(address consumer, address commiter, bytes32 hash, uint256 block, uint256 time);

    function commit(bytes32 hash) public {
        commitReveal.commit(hash, msg.sender);
        emit CommitHash(msg.sender, hash, block.number, block.timestamp);
    }
    event CommitHash(address sender, bytes32 hash, uint256 block, uint256 time);

    function reveal(bytes32 hash, bytes32 seed) public {
        bool consumed;
        Commit memory info;
	console.log("goto call reveal");
        (consumed, info) = commitReveal.reveal(hash, seed, msg.sender);
	console.log("after call reveal");
        emit RevealSeed(info.author, hash, seed, block.number, block.timestamp);
        if (consumed) {
            bytes32 random = commitReveal.genRandom(info);
            emit RandomConsumed(info.author, info.consumer, random, block.number, block.timestamp);
        }
    }
    event RandomConsumed(address commiter, address consumer, bytes32 random, uint256 block, uint256 time);
    event RevealSeed(address commiter, bytes32 hash, bytes32 seed, uint256 block, uint256 time);

    function getCommiterValidCount(address commiter) public view returns (uint256) {
        return stat.getCommiterValidCount(commiter);
    }

    function getConsumerConsumedCount(address consumer) public view returns (uint256) {
        return stat.getConsumerConsumedCount(consumer);
    }

    function getTotalStat() public view returns (uint256, uint256, uint256) {
        return stat.getTotalStat();
    }

    function getUserUnverifiedList(address commiter) public view returns (Commit [] memory) {
        return store.getUserUnverifiedCommits(commiter);
    }

    function getUserSubscribed(address consumer) public view returns (Commit [] memory) {
        return store.getUserSubscribedCommits(consumer);
    }

    function getHash(bytes32 seed) public view returns (bytes32) {
        return commitReveal.getHash(seed);
    }
}
