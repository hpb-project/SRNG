pragma solidity ^0.8.0;

import "../interface/IERC20.sol";
import "../interface/IConfig.sol";
import "../interface/IConsumerBase.sol";
import "../common/Auth.sol";
import "../common/Commit.sol";

contract CommitReveal is Admin {
	uint8 public minblocks = 1;
	uint8 public maxblocks = 200;

	IERC20 hrgToken;
	IConfig config;

	mapping (address => Commit) public commits;

	function setAddress(address token, address _config) public onlyAdmin {
		hrgToken = IERC20(token);
		config = IConfig(_config);
	}

	function commit(bytes32 dataHash) public {
		// todo: add deposit token.

		commits[msg.sender].author = msg.sender;
		commits[msg.sender].commit = dataHash;
		commits[msg.sender].block = uint64(block.number);
		commits[msg.sender].revealed = false;
		commits[msg.sender].status = 0;
		
		emit CommitHash(msg.sender,commits[msg.sender].commit,commits[msg.sender].block);
	}

	event CommitHash(address sender, bytes32 dataHash, uint64 block);

	function reveal(bytes32 seed) public {
		Commit memory info = commits[msg.sender];
		//make sure it has an commit.
		require(info.block != 0, "CommitReveal::reveal: Have no commit need reveal");
		//make sure it hasn't been revealed yet and set it to revealed
		require(info.revealed==false,"CommitReveal::reveal: Already revealed");

		//require that the block number is greater than the original block
		require(uint64(block.number)>info.block,"CommitReveal::reveal: Reveal and commit happened on the same block");

		//require that no more than 250 blocks have passed
		require(uint64(block.number)<=(info.block+maxblocks),"CommitReveal::reveal: Revealed too late");

		commits[msg.sender].revealed=true;

		//require that they can produce the committed hash
		require(getHash(seed)==info.commit,"CommitReveal::reveal: Revealed hash does not match commit");
		commits[msg.sender].seed = seed;
		emit RevealSeed(msg.sender, seed);
		
		// mint new token for commiter.
		uint256 reward = config.GetRewards();
		hrgToken.mint(msg.sender, reward);

		if (info.consumer != address(0)) 
		{
			bytes32 random = genRandom(info);
			IConsumerBase con = IConsumerBase(info.consumer);
			con.responseRandom(info.commit, random);
		}
	}

	event RevealSeed(address sender, bytes32 seed);

	function getHash(bytes32 data) public view returns(bytes32) {
		return keccak256(abi.encodePacked(address(this), data));
	}

	function genRandom(Commit memory info) public returns(bytes32) {
		bytes32 hash = blockhash(info.block);
		return keccak256(abi.encodePacked(hash, info.seed));
	}
}
