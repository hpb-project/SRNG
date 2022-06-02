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
	uint8 public minblocks = 0;
	uint32 public maxblocks = 20000;

	IERC20 			hrgToken;
	IConfig 		config;
	IDepositPool 	tokenPool;
	IStat  			stat;
	IStorage        store;
	address 		oracle;

	modifier onlyOracle() {
        require(msg.sender==oracle, "only oracle could do it");
        _;
    }

	constructor(address _oracle) {
		oracle = _oracle;
		addAdmin(msg.sender);
	}

	function setAddress(address token, address _config, address _pool, address _stat, address _storage) public onlyAdmin {
		hrgToken = IERC20(token);
		config = IConfig(_config);
		tokenPool = IDepositPool(_pool);
		stat = IStat(_stat);
		store = IStorage(_storage);
	}

	function commit(bytes32 hash, address user) public onlyOracle {
		uint256 unverified = stat.getUnVerified(user);
		uint256 maxunverified = config.getMaxUnverify();
		require(unverified <= maxunverified, "unverified commit over flow");

		require(store.checkExist(hash) == false, "commit hash has exist");

		// deposit token.
		uint256 amount = config.getDepositAmount();
		uint256 balance = hrgToken.balanceOf(user);
		require(balance >= amount, "have no enough token for deposit");
		tokenPool.deposit(user, amount);

		Commit memory cmt;

		cmt.author = user;
		cmt.commit = hash;
		cmt.block = block.number;
		store.addNewCommit(user, cmt);

		// add unverified
		stat.addUnVerified(user);
	}

	function reveal(bytes32 hash, bytes32 seed, address user) public onlyOracle returns (bool, Commit memory) {
		Commit memory info = store.getCommit(hash);
		
		require(info.block != 0, "CommitReveal::reveal: Have no commit need reveal");
		require(info.revealed==false,"CommitReveal::reveal: Already revealed");
		require(uint64(block.number)>info.block,"CommitReveal::reveal: Reveal and commit happened on the same block");
		require(uint64(block.number)<=(info.block+maxblocks),"CommitReveal::reveal: Revealed too late");

		//require that they can produce the committed hash
		require(getHash(seed)==info.commit,"CommitReveal::reveal: Revealed hash does not match commit");
		info.seed = seed;

		// add stats.
		stat.addVerifiedCommit(user);

		uint256 reward = tokenPool.getRewards();
		hrgToken.mint(user, reward);
		bool consumed;

		// check consume.
		if (info.consumer != address(0)) 
		{
			store.updateCommitConsumed(user, hash, seed);
			
			bytes32 random = genRandom(info);
			IConsumerBase con = IConsumerBase(info.consumer);
			con.responseRandom(info.commit, random);

			consumed = true;

			// reward consumer fee.
			uint256 feeAmount = config.getFee();
			tokenPool.rewardFee(user, feeAmount);
			
			stat.addConsumedCommit(user, info.consumer);
		} else {
			store.updateCommitVerified(user, hash, seed);
			consumed = false;
		}
		
		// withdraw token.
		uint256 amount = config.getDepositAmount();
		tokenPool.withdraw(user, amount);

		return (consumed,info);
	}

	function getHash(bytes32 data) public view returns(bytes32) {
		return keccak256(abi.encodePacked(address(this), data));
	}

	function genRandom(Commit memory info) public view returns(bytes32) {
		bytes32 hash = blockhash(info.block);
		return keccak256(abi.encodePacked(hash, info.seed));
	}

	function subScribeCommit(address user, address consumer, bytes32 hash) public onlyOracle {
		uint256 fee = config.getFee();
		uint256 balance = hrgToken.balanceOf(user);
		require(balance >= fee, "CommitReveal::Not enough token for fee");
		store.subscribeCommit(user, consumer, hash);
		tokenPool.deposit(user, fee);
	}

	function unSubscribeCommit(address user, bytes32 hash) public onlyOracle {
		store.unsubscribeCommit(user, hash);
		uint256 fee = config.getFee();
		tokenPool.withdraw(user, fee/2);      // only withdraw 1/2 fee.
	}
}
