// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenA is ERC20 {
    constructor (uint initSupply) ERC20("Token A", "A") {
        _mint(msg.sender, initSupply);
    }

    function mint() external {
        _mint(msg.sender, 100);
    }
}
