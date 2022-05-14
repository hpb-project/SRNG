// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Admin is Ownable {
    mapping(address => bool) private admins;

    modifier onlyAdmin() {
        require(admins[msg.sender], "!admin");
        _;
    }

    function addAdmin(address _admin) public onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) public onlyOwner {
        admins[_admin] = false;
    }
}