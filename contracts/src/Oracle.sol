// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IStorage.sol";
import "../interface/IConsumerBase.sol";
import "../interface/ICommitReveal.sol";
import "../interface/IDepositPool.sol";
import "../interface/IInterStore.sol";
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
    IInternalStore internalstore;
    constructor() {
		addAdmin(msg.sender);
	}

    function setting(address _token, address _config, address _deposit, address _store,
        address _commitReveal, address _stat, address _internalstore) public onlyAdmin {
        hrgtoken = IERC20(_token);
        config = IConfig(_config);
        tokenPool = IDepositPool(_deposit);
        store = IStorage(_store);
        commitReveal = ICommitReveal(_commitReveal);
        stat = IStat(_stat);
        internalstore = IInternalStore(_internalstore);
    }

    function requestRandom(address user, address consumer, bytes32 token) public returns (bool) {
        bool find;
        Commit memory info;
        (find, info) = store.findCommit();
        require(find == true, "Oracle::Not found commit");
        uint256 fee = config.getFee();
	    uint256 balance = hrgtoken.balanceOf(msg.sender);
	    require(balance >= fee, "Oracle::Not enough token for fee");
        require(hrgtoken.transferFrom(msg.sender, address(tokenPool), fee), "Oracle::Transfer fee failed");

        commitReveal.subScribeCommit(user, consumer, info.commit);
        internalstore.addSubtoken(info.commit, token);
        emit Subscribe(consumer, info.author, info.commit, block.number, block.timestamp);
        
        return true;
    }

    event Subscribe(address consumer, address commiter, bytes32 hash, uint256 block, uint256 time);

    function unsubscribeRandom(address consumer, bytes32 hash) public {
        Commit memory info = store.getCommit(hash);
        require(info.substatus == 1, "commit not subscribe");
        require(info.consumer == msg.sender || info.subsender == msg.sender, "not consumer or author");
        uint256 unsubBlocks = config.getUnSubBlocks();
        require((info.subBlock + unsubBlocks) >= block.number, "out of unsub max blockx");


        commitReveal.unSubscribeCommit(consumer, hash);
        internalstore.rmSubtoken(info.commit);
        emit UnSubscribe(consumer, info.author, hash, block.number, block.timestamp);
        
    }
    event UnSubscribe(address consumer, address commiter, bytes32 hash, uint256 block, uint256 time);

    function getRandom(bytes32 commit) public view returns (bytes32) {
        Commit memory info = store.getCommit(commit);
        require(msg.sender == info.subsender || msg.sender == info.consumer, "sender not match author and consumer");
        bytes32 seed = info.seed;
        if(seed == bytes32(0)) {
            // check commit reveal expire time out, then feed back hpb real random and reback fee.
            if(block.number > info.block + config.getMaxVerifyBlocks()) {
                // get hpb real random.
                seed = info.hrandom;
            } else {
                require(false, "commit not reveald");
            }
        }
        bytes32 token = internalstore.getSubtoken(commit);
        bytes32 result = keccak256(abi.encodePacked(token, seed));
        
        return result;
    }

    function commit(bytes32 hash) public {
   		// deposit token.
		uint256 amount = config.getDepositAmount();
		uint256 balance = hrgtoken.balanceOf(msg.sender);
		require(balance >= amount, "have no enough token for deposit");
        require(hrgtoken.transferFrom(msg.sender, address(tokenPool), amount), "transfer failed");

        commitReveal.commit(hash, msg.sender);
        emit CommitHash(msg.sender, hash, block.number, block.timestamp);
    }
    event CommitHash(address sender, bytes32 hash, uint256 block, uint256 time);

    function reveal(bytes32 hash, bytes32 seed) public {
        bool consumed;
        Commit memory info;
        (consumed, info) = commitReveal.reveal(hash, seed, msg.sender);

        emit RevealSeed(info.author, hash, seed, block.number, block.timestamp);
        if (consumed) {
            emit RandomConsumed(info.author, info.consumer, hash, block.number, block.timestamp);
        }
    }
    event RandomConsumed(address commiter, address consumer, bytes32 hash, uint256 block, uint256 time);
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

    function getUserCommitsList(address commiter) public view returns (Commit [] memory) {
        return store.getUserCommits(commiter);
    }

    function getUserSubscribed(address user) public view returns (Commit [] memory) {
        return store.getUserSubscribedCommits(user);
    }

    function getHash(bytes32 seed) public view returns (bytes32) {
        return commitReveal.getHash(seed);
    }

    function splitSignature(bytes memory sig)  internal  pure returns (uint8, bytes32, bytes32)    {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        if (v==0 || v==1) {
            v = v+27;
        }

        return (v, r, s);
    }

    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(
        abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(toEthSignedMessageHash(message), v, r, s);
    }
}
