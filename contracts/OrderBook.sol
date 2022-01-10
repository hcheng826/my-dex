// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IOrderBook } from "./interfaces/IOrderBook.sol";

// exchange pair: token1/token0
contract OrderBook is IOrderBook {
    ERC20 public tradeToken;
    ERC20 public baseToken;

    Order[] public orderById;
    uint256 highestBuyOrderId;
    uint256 lowestSellOrderId;

    constructor(address _tradeTokenAddress, address _baseTokenAddress) {
        tradeToken = ERC20(_tradeTokenAddress);
        baseToken = ERC20(_baseTokenAddress);
        orderById.push(Order(msg.sender, 0, 0, 0)); // highest buy
        orderById.push(Order(msg.sender, 2^256-1, 0, 0)); // lowest sell
        highestBuyOrderId = 0;
        lowestSellOrderId = 1;
    }

    modifier validPriceAmount(uint256 _price, uint256 _amount) {
        require(_price > 0 && _amount > 0, "invalid price or amount");
        _;
    }

    function placeBuyOrder(uint256 _price, uint256 _amount) external validPriceAmount(_price, _amount) {
        require(
            baseToken.balanceOf(msg.sender) >= _amount*_price,
            string(abi.encodePacked("insufficient ", baseToken.symbol()))
        );

        uint256 residualAmount = matchSellOrders(_amount, _price);
        if (residualAmount != 0) {
            insertBuyOrder(residualAmount, _price);
        }
    }

    // Sell token0 for token1
    function placeSellOrder(uint256 _price, uint256 _amount) external validPriceAmount(_price, _amount) {}

    function matchSellOrders(uint256 _price, uint256 _amount) internal returns (uint256 _residualAmount) {
        Order storage lowestSellOrder = orderById[lowestSellOrderId];
        uint256 residualAmount = _amount;

        while (lowestSellOrder.price < _price) {
            if (lowestSellOrder.amount > residualAmount) {
                lowestSellOrder.amount -= residualAmount;
                executeOrder(msg.sender, lowestSellOrder.maker, getExecutionPrice(_price, lowestSellOrder.price), residualAmount);
                return 0;
            } else {
                residualAmount -= lowestSellOrder.amount;
                executeOrder(msg.sender, lowestSellOrder.maker, getExecutionPrice(_price, lowestSellOrder.price), lowestSellOrder.amount);
                uint256 nextLowsetOrderId = lowestSellOrder.nextOrderId;
                if (nextLowsetOrderId == 0) { // no more sell orders back to dummy order
                    lowestSellOrder.amount = 0;
                    lowestSellOrder.price = 0;
                } else {
                    lowestSellOrderId = nextLowsetOrderId;
                    delete orderById[lowestSellOrderId];
                }
                lowestSellOrder = orderById[lowestSellOrderId];
            }
        }
        return residualAmount;
    }

    function matchBuyOrders(uint256 _price, uint256 _amount) internal returns (uint256 _residualAmount) {}
    function insertBuyOrder(uint256 _price, uint256 _amount) internal {}
    function insertSellOrder(uint256 _price, uint256 _amount) internal {}
    function executeOrder(address _buyer, address _seller, uint256 _price, uint256 _amount) internal {
        // transfer the token
    }
    function getExecutionPrice(uint256 _buyPrice, uint256 _sellPrice) pure internal returns (uint256) {
        return (_buyPrice + _sellPrice) / 2;
    }
}
