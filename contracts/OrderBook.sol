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
        highestBuyOrderId = 0; // dummy buy order
        lowestSellOrderId = 1; // dummy sell order
    }

    modifier positivePriceAmount(uint256 _price, uint256 _amount) {
        require(_price > 0 && _amount > 0, "invalid price or amount");
        _;
    }

    function placeOrder(uint256 _price, uint256 _amount, bool _isBuy) external positivePriceAmount(_price, _amount) {
        ERC20 tokenAtHand = _isBuy ? baseToken : tradeToken;
        require(tokenAtHand.balanceOf(msg.sender) >= _amount, string(abi.encodePacked("insufficient ", tokenAtHand.symbol())));

        uint256 residualAmount = matchOrders(_amount, _price, _isBuy);
        if (residualAmount != 0) {
            insertOrder(residualAmount, _price, _isBuy);
        }
    }

    function matchOrders(uint256 _price, uint256 _amount, bool _isBuy) internal returns (uint256 _residualAmount) {
        uint256 edgeOrderId = _isBuy ? lowestSellOrderId : highestBuyOrderId;
        Order storage edgeOrder = orderById[edgeOrderId];
        uint256 residualAmount = _amount;

        bool canExecute = _isBuy ? edgeOrder.price <= _price : edgeOrder.price >= _price;

        while (canExecute) {
            if (edgeOrder.amount > residualAmount) {
                edgeOrder.amount -= residualAmount;
                executeOrder(msg.sender, edgeOrder.maker, getExecutionPrice(_price, edgeOrder.price), residualAmount);
                return 0;
            } else {
                residualAmount -= edgeOrder.amount;
                executeOrder(msg.sender, edgeOrder.maker, getExecutionPrice(_price, edgeOrder.price), edgeOrder.amount);

                uint256 nextEdgeOrderId = edgeOrder.nextOrderId;
                if (_isBuy) {
                    lowestSellOrderId = nextEdgeOrderId;
                } else {
                    highestBuyOrderId = nextEdgeOrderId;
                }

                edgeOrder = orderById[nextEdgeOrderId];
            }
            canExecute = _isBuy ? edgeOrder.price <= _price : edgeOrder.price >= _price;
        }
        return residualAmount;
    }

    function insertOrder(uint256 _price, uint256 _amount, bool _isBuy) internal {

    }
    function executeOrder(address _buyer, address _seller, uint256 _price, uint256 _amount) internal {
        // transfer the token
    }
    function getExecutionPrice(uint256 _buyPrice, uint256 _sellPrice) pure internal returns (uint256) {
        return (_buyPrice + _sellPrice) / 2;
    }
}
