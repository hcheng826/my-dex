// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenB is ERC20 {
    constructor (uint initSupply) ERC20("Token B", "B") {
        _mint(msg.sender, initSupply);
    }
}
