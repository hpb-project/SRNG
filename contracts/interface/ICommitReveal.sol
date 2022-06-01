// SPDX-License-Identifier: MIT
pragma solidity ^ 0.8.0;
import "../common/Commit.sol";

interface ICommitReveal {
    function commit(bytes32, address) external;
    function reveal(bytes32, bytes32, address) external returns (bool, Commit memory);
    function getHash(bytes32) external view returns(bytes32);
    function genRandom(Commit memory) external view returns(bytes32);
    function subScribeCommit(address, bytes32) external;
    function unSubscribeCommit(address, bytes32) external;
}