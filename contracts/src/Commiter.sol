pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IConsumerBase.sol";
import "../interface/IDepositPool.sol";
import "../interface/IStat.sol";
import "../interface/IStorage.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";

contract CommitReveal is Admin {
	uint8 public minblocks = 1;
	uint8 public maxblocks = 200;

	IERC20 			hrgToken;
	IConfig 		config;
	IDepositPool 	tokenPool;
	IStat  			stat;
	IStorage        store;

	function setAddress(address token, address _config, address _pool, address _stat, address _storage) public onlyAdmin {
		hrgToken = IERC20(token);
		config = IConfig(_config);
		tokenPool = IDepositPool(_pool);
		stat = IStat(_stat);
		store = IStorage(_storage);
	}

	function commit(bytes32 hash) public {
		uint256 unverified = stat.getUnVerified(msg.sender);
		uint256 maxunverified = config.getMaxUnverify();
		require(unverified <= maxunverified, "unverified commit over flow");

		require(store.checkExist(hash) == false, "commit hash has exist");

		// deposit token.
		uint256 amount = config.getDepositAmount();
		uint256 balance = hrgToken.balanceOf(msg.sender);
		require(balance >= amount, "have no enough token for deposit");
		tokenPool.deposit(msg.sender, amount);

		Commit memory cmt;

		cmt.author = msg.sender;
		cmt.commit = hash;
		cmt.block = block.number;
		store.addNewCommit(msg.sender, cmt);

		// add unverified
		stat.addUnVerified(msg.sender);
	}

	function reveal(bytes32 hash, bytes32 seed) public returns (bool, Commit memory) {
		Commit memory info = store.getCommit(hash);
		
		require(info.block != 0, "CommitReveal::reveal: Have no commit need reveal");
		require(info.revealed==false,"CommitReveal::reveal: Already revealed");
		require(uint64(block.number)>info.block,"CommitReveal::reveal: Reveal and commit happened on the same block");
		require(uint64(block.number)<=(info.block+maxblocks),"CommitReveal::reveal: Revealed too late");

		//require that they can produce the committed hash
		require(getHash(seed)==info.commit,"CommitReveal::reveal: Revealed hash does not match commit");
		info.seed = seed;

		// add stats.
		stat.addVerifiedCommit(msg.sender);

		// todo: mint new token for commiter.
		uint256 reward = config.getRewards();
		hrgToken.mint(msg.sender, reward);
		bool consumed;

		// check consume.
		if (info.consumer != address(0)) 
		{
			store.updateCommitConsumed(msg.sender, hash, seed);
			
			bytes32 random = genRandom(info);
			IConsumerBase con = IConsumerBase(info.consumer);
			con.responseRandom(info.commit, random);

			consumed = true;

			// reward consumer fee.
			uint256 feeAmount = config.getFee();
			tokenPool.rewardFee(msg.sender, feeAmount);
			
			stat.addConsumedCommit(msg.sender, info.consumer);
		} else {
			store.updateCommitVerified(msg.sender, hash, seed);
			consumed = false;
		}
		
		// withdraw token.
		uint256 amount = config.getDepositAmount();
		tokenPool.withdraw(msg.sender, amount);

		return (consumed,info);
	}

	function getHash(bytes32 data) public view returns(bytes32) {
		return keccak256(abi.encodePacked(address(this), data));
	}

	function genRandom(Commit memory info) public view returns(bytes32) {
		bytes32 hash = blockhash(info.block);
		return keccak256(abi.encodePacked(hash, info.seed));
	}
}
