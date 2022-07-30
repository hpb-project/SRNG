// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IInternalStore {
    function addSubtoken(bytes32 commit, bytes32 token) external returns (bool);

    function rmSubtoken(bytes32 commit) external returns (bool) ;

    function getSubtoken(bytes32 commit) external view returns (bytes32) ;
}
