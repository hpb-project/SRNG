// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../common/Auth.sol";
import "../common/Commit.sol";

contract Storage is Admin {
    struct Unverified {
        uint32  count;              
        bytes32 [] CommitsList;
    }

    struct Subscribed {
        bool exist;
        uint32 count;
        bytes32 [] SubList;
    }

    mapping(bytes32 => Commit) CommitPool;          // all unverified commit
    mapping(bytes32 => Commit) HistoryCommits;
    
    mapping(address => Unverified) UserCommits;     // save all user's unverified commit.
    address [] Commiters;                           // all commiter that have commit in pool.
    uint256    CommiterCount;

    mapping(address => Subscribed) UserSubscribed;  // save all user's un-finished subscribe.

    constructor() {
		addAdmin(msg.sender);
	}

    function _addConsumerSubscribe(address consumer, bytes32 hash) internal {
        if (UserSubscribed[consumer].exist) {
            Subscribed memory info = UserSubscribed[consumer];
            if (info.count <= info.SubList.length) {
                UserSubscribed[consumer].SubList.push(hash);
            } else {
                UserSubscribed[consumer].SubList[info.count] = hash;
            }
            UserSubscribed[consumer].count++;
        } else {
            UserSubscribed[consumer].exist = true;
            UserSubscribed[consumer].SubList.push(hash);
            UserSubscribed[consumer].count ++;
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

    function _addUnverifiedCommit(address commiter, bytes32 commit) internal {
        if (UserCommits[commiter].count == 0) {
            // new commiter
            _addNewCommiter(commiter);
        }
        UserCommits[commiter].count += 1;
        UserCommits[commiter].CommitsList.push(commit);
    }

    function _rmUnverifiedCommit(address commiter, bytes32 commit) internal {
        bytes32[] storage list = UserCommits[commiter].CommitsList;
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == commit) {
                list[i] = list[list.length-1];
                delete list[list.length-1];
                break;
            }
        }
        if (list.length == 0) {
            delete UserCommits[commiter];
            _rmCommiter(commiter);
        } else {
            UserCommits[commiter].CommitsList = list;
            UserCommits[commiter].count = uint32(list.length);
        }
        return ;
    }

    // get user unverified commits.
    function _getUserCommit(address commiter) public view returns (Commit [] memory) {
        bytes32 [] memory list = UserCommits[commiter].CommitsList;
        Commit [] memory commits = new Commit[](list.length); 
        for (uint i = 0; i < list.length; i++) {
            bytes32 h = list[i];
            commits[i] = CommitPool[h];
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

    function addNewCommit(address commiter, Commit memory commit) public {
        bytes32 hash = commit.commit;
        require(checkExist(hash) == false, "commit already exist");
        _addToCommitPool(hash, commit);
        _addUnverifiedCommit(commiter, hash);
    }

    function getCommit(bytes32 hash) public view returns (Commit memory) {
        return _getCommit(hash);
    }

    function getUserUnverifiedCommits(address commiter) public view returns (Commit [] memory) {
        return _getUserCommit(commiter);
    }

    function getUserSubscribedCommits(address consumer) public view returns (Commit [] memory) {
        
        uint32 valid = 0;
        Subscribed memory info = UserSubscribed[consumer];
        for (uint32 i = 0; i < info.count; i++) {
            bytes32 hash = info.SubList[i];
            Commit memory cmt = getCommit(hash);
            if (cmt.block == 0) {
                // not found.
            } else if (cmt.verifiedBlock <= (block.number - 1000)) {
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
            } else if (cmt.verifiedBlock <= (block.number - 1000)) {
                // too old.
            } else {
                commits[idx] = cmt;
                idx++;
            }
        }
        return commits;
    }


    function _updateCommitSubscribe(bytes32 hash, address consumer) internal {
        Commit memory commit = CommitPool[hash];
        require(commit.block != 0, "commit not found");
        require(commit.substatus == 0, "commit has been subscribed");
        commit.consumer = consumer;
        commit.subBlock = block.number;
        commit.substatus = 1;
        CommitPool[hash] = commit;
        _addConsumerSubscribe(consumer, hash);
    }

    function _updateCommitUnSubscribe(bytes32 hash, address consumer) internal {
        Commit memory commit = CommitPool[hash];
        require(commit.block != 0, "commit not found");
        require(commit.consumer == consumer, "commit consumer not match");
        require(commit.substatus == 1, "commit not been subscribed");
        commit.consumer = address(0);
        commit.subBlock = 0;
        commit.substatus = 0;
        CommitPool[hash] = commit;

        _rmConsumerSubscribe(consumer, hash);
    }

    function updateCommitVerified(address commiter, bytes32 hash, bytes32 seed) public {
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
    }

    function updateCommitConsumed(address commiter, bytes32 hash, bytes32 seed) public {
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
    }

    function _updateCommitSubscribe(address consumer, bytes32 hash) internal {
        require(CommitPool[hash].block != 0, "commit not exist");
        require(CommitPool[hash].substatus == 0, "commit has been subscribed");

        CommitPool[hash].consumer = consumer;
        CommitPool[hash].substatus = 1;
    }

    function _findSubableCommit() internal view returns (bool, Commit memory) {
        for (uint256 i = 0; i < CommiterCount; i++) {
            address commiter = Commiters[i];
            Unverified memory ulist = UserCommits[commiter];

            for (uint32 j = 0; j < ulist.count; j++) {
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
    
    function subscribeCommit(address consumer, bytes32 hash) public {
        _updateCommitSubscribe(hash, consumer);
    }

    function unsubscribeCommit(address consumer, bytes32 hash) public {
        _updateCommitUnSubscribe(hash, consumer);
    }
}