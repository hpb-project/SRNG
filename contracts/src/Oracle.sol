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

    function requestRandom(address consumer) public returns (bool) {
        bool find;
        Commit memory info;
        (find, info) = store.findCommit();
        require(find == true, "Oracle::Not fund commit");
        uint256 fee = config.getFee();
        uint256 balance = hrgtoken.balanceOf(msg.sender);
        require(balance >= fee, "Oracle::Not enough token for fee");
        tokenPool.deposit(msg.sender, fee);
        emit Subscribe(consumer, info.author, info.commit, block.number);
        return true;
    }
    event Subscribe(address consumer, address commiter, bytes32 hash, uint256 block);

    function unsubscribeRandom(address consumer, bytes32 hash) public {
        Commit memory info = store.getCommit(hash);
        require(info.substatus == 1, "commit not subscribe");
        uint256 unsubBlocks = config.getUnSubBlocks();
        require((info.subBlock + unsubBlocks) >= block.number, "out of unsub max blockx");
        store.unsubscribeCommit(consumer, hash);
        uint256 fee = config.getFee();
        tokenPool.withdraw(msg.sender, fee/2);      // only withdraw 1/2 fee.
        emit UnSubscribe(consumer, info.author, hash, block.number);
    }
    event UnSubscribe(address consumer, address commiter, bytes32 hash, uint256 block);

    function commit(bytes32 hash) public {
        commitReveal.commit(hash);
        emit CommitHash(msg.sender, hash, block.number);
    }
    event CommitHash(address sender, bytes32 dataHash, uint256 block);

    function reveal(bytes32 hash, bytes32 seed) public {
        bool consumed;
        Commit memory info;
        (consumed, info) = commitReveal.reveal(hash, seed);
        emit RevealSeed(info.author, seed, block.number);
        if (consumed) {
            bytes32 random = commitReveal.genRandom(info);
            emit RandomConsumed(info.author, info.consumer, random, block.number);
        }
    }
    event RandomConsumed(address commiter, address consumer, bytes32 random, uint256 block);
    event RevealSeed(address commiter, bytes32 seed, uint256 block);

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
        // todo: implement get subscribe commit list.
        
    }
}