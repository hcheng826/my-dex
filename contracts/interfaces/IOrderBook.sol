// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOrderBook {
    struct Order {
        address maker;
        uint256 price;
        uint256 amount;
        uint256 nextOrderId;
    }

    function placeBuyOrder(uint price, uint amount) external;
    function placeSellOrder(uint price, uint amount) external;

    event PlaceBuyOrder(address maker, uint price, uint amount);
    event PlaceSellOrder(address maker, uint price, uint amount);
}
