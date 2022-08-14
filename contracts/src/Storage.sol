// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../common/Auth.sol";
import "../common/Commit.sol";
import "hardhat/console.sol";

contract Storage is Admin {
    struct Unverified {
        uint32  count;              
        bytes32 [] CommitsList;
    }

    struct Verified {
        uint256 count;
        bytes32 [] CommitsList;
    }

    struct Subscribed {
        bool exist;
        uint256 count;
        bytes32 [] SubList;
    }

    mapping(bytes32 => Commit) CommitPool;          // all unverified commit
    mapping(bytes32 => Commit) HistoryCommits;
    
    mapping(address => Unverified) UserUnVerifiedCommits;     // save all user's unverified commit.
    mapping(address => Verified) UserVerifiedCommits;
    address [] Commiters;                           // all commiter that have commit in pool.
    uint256    CommiterCount;

    mapping(address => Subscribed) UserSubscribed;  // save all user's un-finished subscribe.

    address _commiter;
    modifier onlyCommiter() {
        require(msg.sender==_commiter, "only commiter could do it");
        _;
    }

    constructor(address commiter) {
        _commiter = commiter;
		addAdmin(msg.sender);
	}
    
    function setAddress(address commiter) public onlyAdmin {
        _commiter = commiter;
    }

    function _addConsumerSubscribe(address consumer, bytes32 hash) internal {
        if (UserSubscribed[consumer].exist) {
            Subscribed memory info = UserSubscribed[consumer];
            if (info.count < info.SubList.length) {
                UserSubscribed[consumer].SubList[info.count] = hash;
	        UserSubscribed[consumer].count++;
            } else {
                UserSubscribed[consumer].SubList.push(hash);
                UserSubscribed[consumer].count = UserSubscribed[consumer].SubList.length;
            }

        } else {
            UserSubscribed[consumer].exist = true;
            UserSubscribed[consumer].SubList.push(hash);
            UserSubscribed[consumer].count = UserSubscribed[consumer].SubList.length;
        }
    }

    function _rmConsumerSubscribe(address consumer, bytes32 hash) internal {
        require(UserSubscribed[consumer].exist, "not found consumer with subscribe");
        Subscribed memory info = UserSubscribed[consumer];
        for (uint32 i = 0; i < info.count; i++) {
            if (hash == info.SubList[i]) {
                info.SubList[i] = info.SubList[info.count-1];
                delete(info.SubList[info.count-1]);
                info.count--;
                UserSubscribed[consumer] = info;
		break;
            }
        }
    }

    // 
    function _addNewCommiter(address commiter) internal {
        if (Commiters.length <= CommiterCount) {
            Commiters.push(commiter);
        } else {
            Commiters[CommiterCount] = commiter;
        }
        CommiterCount++;
    }

    // rm commiter when User unverified commits list empty.
    function _rmCommiter(address commiter) internal {
        for(uint256 i = 0; i < Commiters.length; i++) {
            if (Commiters[i] == commiter) {
                Commiters[i] = Commiters[Commiters.length-1];
                delete Commiters[Commiters.length-1];
                CommiterCount --;
                break;
            }
        }
    }

    function _addToCommitPool(bytes32 hash, Commit memory commit) internal {
        require(CommitPool[hash].block == 0, "commit exist in pool");
        CommitPool[hash] = commit;
    }

    function _addToHistoryCommit(bytes32 hash, Commit memory commit) internal {
        require(HistoryCommits[hash].block == 0, "commit exist in history");
        HistoryCommits[hash] = commit;
    }

    function _addToVerifiedCommit(address commiter, bytes32 commit) internal {
        UserVerifiedCommits[commiter].CommitsList.push(commit);
        UserVerifiedCommits[commiter].count += 1;
    }

    function _addUnverifiedCommit(address commiter, bytes32 commit) internal {
        Unverified memory info = UserUnVerifiedCommits[commiter];
        if (info.count == 0) {
            // add to commiter list.
            _addNewCommiter(commiter);
        }
	if (info.CommitsList.length > info.count) {
	    UserUnVerifiedCommits[commiter].CommitsList[info.count] = commit;
        } else {
	    UserUnVerifiedCommits[commiter].CommitsList.push(commit);
        }
	UserUnVerifiedCommits[commiter].count += 1;
    }

    function _rmUnverifiedCommit(address commiter, bytes32 commit) internal {
	Unverified memory info = UserUnVerifiedCommits[commiter];
        for (uint i = 0; i < info.count; i++) {
		if (info.CommitsList[i] == commit) {
			UserUnVerifiedCommits[commiter].CommitsList[i] = info.CommitsList[info.count-1];
			delete UserUnVerifiedCommits[commiter].CommitsList[info.count-1];
			info.count -= 1;
			UserUnVerifiedCommits[commiter].count -= 1;
			break;
                }
        }
        if (info.count == 0) {
            delete UserUnVerifiedCommits[commiter];
            _rmCommiter(commiter);
        }
        return ;
    }

    // get user unverified commits.
    function _getUserUnverifiedCommit(address commiter) public view returns (Commit [] memory) {
	    Unverified memory info = UserUnVerifiedCommits[commiter];
        bytes32 [] memory list = info.CommitsList;
        Commit [] memory commits = new Commit[](info.count); 
        for (uint i = 0; i < info.count; i++) {
            bytes32 h = list[info.count - i - 1];
            commits[i] = CommitPool[h];
        }
        return commits;
    }

    // get user verified commits.
    function _getUserVerifiedCommit(address commiter) public view returns (Commit [] memory) {
	    Verified memory info = UserVerifiedCommits[commiter];
        bytes32 [] memory list = info.CommitsList;
        uint maxcount = 500;
        if (info.count < maxcount) {
            maxcount = info.count;
        }

        Commit [] memory commits = new Commit[](maxcount); 
        
        for (uint i = 0; i < maxcount; i++) {
            bytes32 h = list[info.count - 1 - i];
            Commit memory commit = _getCommit(h);
            if (commit.verifiedBlock != 0) {
                commits[i] = commit;
            }
        }
        return commits;
    }

    function checkExist(bytes32 hash) public view returns (bool) {
        if (CommitPool[hash].block != 0) { // find in unverified pool.
            return true;
        } else if (HistoryCommits[hash].block != 0) { // find in verified pool.
            return true;
        }
        return false;
    }

    function _getCommit(bytes32 commit) public view returns (Commit memory) {
        if (CommitPool[commit].block != 0) { // find in unverified pool.
            return CommitPool[commit];
        } else if (HistoryCommits[commit].block != 0) { // find in verified pool.
            return HistoryCommits[commit];
        } else {
            Commit memory cmt;
            return cmt;
        }
    }

    function addNewCommit(address commiter, Commit memory commit) public onlyCommiter {
        bytes32 hash = commit.commit;
        require(checkExist(hash) == false, "commit already exist");
        _addToCommitPool(hash, commit);
        _addUnverifiedCommit(commiter, hash);
    }

    function getCommit(bytes32 hash) public view returns (Commit memory) {
        return _getCommit(hash);
    }

    function getUserUnverifiedCommits(address commiter) public view returns (Commit [] memory) {
        return _getUserUnverifiedCommit(commiter);
    }

    function getUserCommits(address commiter) public view returns (Commit [] memory) {
        Commit [] memory unverified = _getUserUnverifiedCommit(commiter);
        Commit [] memory verified = _getUserVerifiedCommit(commiter);
        Commit [] memory all = new Commit[](unverified.length+verified.length);
        uint256 idx = 0;
        for(idx = 0; idx < unverified.length; idx++) {
            all[idx] = unverified[idx];
        }
        for(idx = 0; idx < verified.length; idx++) {
            all[idx+unverified.length] = verified[idx];
        }
        return all;
    }

    function getUserSubsInfo(address user) public view returns(Subscribed memory) {
        Subscribed memory info = UserSubscribed[user];
	return info;
    }

    function getUserSubscribedCommits(address user) public view returns (Commit [] memory) {
        
        uint32 valid = 0;
        Subscribed memory info = UserSubscribed[user];
        for (uint32 i = 0; i < info.count; i++) {
            bytes32 hash = info.SubList[i];
            Commit memory cmt = getCommit(hash);
            if (cmt.block == 0) {
                // not found.
            } else if (cmt.verifiedBlock != 0 && ( block.number >= (cmt.verifiedBlock + 500000 ))) {
                // too old.
            } else {
                valid++;
            }
        }
        if (valid == 0) {
            Commit [] memory empty;
            return empty;
        }
        Commit [] memory commits = new Commit[](valid);
        uint32 idx = 0;
        for (uint32 i = 0; i < info.count; i++) {
            bytes32 hash = info.SubList[i];
            Commit memory cmt = getCommit(hash);
            if (cmt.block == 0) {
                // not found.
            } else if (cmt.verifiedBlock != 0 && ( block.number >= (cmt.verifiedBlock + 500000 ))) {
                // too old.
            } else {
                commits[idx] = cmt;
                idx++;
            }
        }
        return commits;
    }


    function _updateCommitSubscribe(address user, address consumer, bytes32 hash) internal {
        Commit memory commit = CommitPool[hash];
        require(commit.block != 0, "commit not found");
        require(commit.substatus == 0, "commit has been subscribed");

        commit.consumer = consumer;
	    commit.subsender = user;
        commit.subBlock = block.number;
        commit.substatus = 1;
        CommitPool[hash] = commit;
        _addConsumerSubscribe(user, hash);
    }

    function _updateCommitUnSubscribe(address user, bytes32 hash) internal {
        Commit memory commit = CommitPool[hash];
        require(commit.block != 0, "commit not found");
        require(commit.subsender == user, "commit subscribe user not match");
        require(commit.substatus == 1, "commit not been subscribed");
	    commit.subsender = address(0);
        commit.consumer = address(0);
        commit.subBlock = 0;
        commit.substatus = 0;
        CommitPool[hash] = commit;

        _rmConsumerSubscribe(user, hash);
    }

    function updateCommitVerified(address commiter, bytes32 hash, bytes32 seed) public onlyCommiter {
        Commit memory commit = CommitPool[hash];
        require(commit.block != 0, "commit not found");
        commit.seed = seed;
        commit.revealed = true;
        commit.verifiedBlock = block.number;
        // remove from pool.
        delete(CommitPool[hash]);
        
        // remove from user unverified list.
        _rmUnverifiedCommit(commiter, hash);

        // add to history.
        _addToHistoryCommit(hash, commit);

        // add to verified list.
        _addToVerifiedCommit(commiter, hash);

    }

    function updateCommitConsumed(address commiter, bytes32 hash, bytes32 seed) public onlyCommiter {
        Commit memory commit = CommitPool[hash];
        require(commit.block != 0, "commit not found");
        require(commit.substatus == 1, "commit no subscribed");
        commit.seed = seed;
        commit.revealed = true;
        commit.verifiedBlock = block.number;

        commit.substatus = 2;
        // remove from pool.
        delete(CommitPool[hash]);
        
        // remove from user unverified list.
        _rmUnverifiedCommit(commiter, hash);

        // add to history.
        _addToHistoryCommit(hash, commit);
        
        // add to verified list.
        _addToVerifiedCommit(commiter, hash);
    }

    function _findSubableCommit() internal view returns (bool, Commit memory) {
        for (uint256 i = 0; i < CommiterCount; i++) {
            address commiter = Commiters[i];
            Unverified memory ulist = UserUnVerifiedCommits[commiter];
	        //console.log("ulist count",ulist.count);

            for (uint32 j = 0; j < ulist.count; j++) {
        		//console.logBytes32(ulist.CommitsList[j]);
                Commit memory commit = CommitPool[ulist.CommitsList[j]];
                if (commit.substatus == 0) {
                    return (true,commit);
                }
            }
        }
        Commit memory c;
        return (false,c);
    }

    function findCommit() public view returns (bool, Commit memory) {
        bool find;
        Commit memory commit ;
        (find, commit) = _findSubableCommit();

        return (find, commit);
    }
    
    function subscribeCommit(address user,address consumer, bytes32 hash) public onlyCommiter {
        _updateCommitSubscribe(user, consumer, hash);
    }

    function unsubscribeCommit(address user, bytes32 hash) public onlyCommiter {
        _updateCommitUnSubscribe(user, hash);
    }
}
