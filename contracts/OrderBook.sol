// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IOrderBook } from "./interfaces/IOrderBook.sol";

// exchange pair: token1/token0
contract OrderBook is IOrderBook {
    ERC20 public tradeToken;
    ERC20 public baseToken;

    // Order[] public orderById;
    mapping(uint256 => Order) public orderById;
    uint256 orderIdCounter;
    uint256 highestBuyOrderId;
    uint256 lowestSellOrderId;

    constructor(address _tradeTokenAddress, address _baseTokenAddress) {
        tradeToken = ERC20(_tradeTokenAddress);
        baseToken = ERC20(_baseTokenAddress);
        orderById[0] = Order(msg.sender, 0, 0, 0);
        orderById[1] = Order(msg.sender, 2^256-1, 0, 0);
        // orderById.push(Order(msg.sender, 0, 0, 0)); // highest buy
        // orderById.push(Order(msg.sender, 2^256-1, 0, 0)); // lowest sell
        highestBuyOrderId = 0; // dummy buy order
        lowestSellOrderId = 1; // dummy sell order
        orderIdCounter = 2;
    }

    modifier positivePriceAmount(uint256 _price, uint256 _amount) {
        require(_price > 0 && _amount > 0, "invalid price or amount");
        _;
    }

    function placeOrder(bool _isBuy, uint256 _price, uint256 _amount) external positivePriceAmount(_price, _amount) {
        if (_isBuy) {
            require(baseToken.balanceOf(msg.sender) >= _amount*_price, string(abi.encodePacked("insufficient ", baseToken.symbol())));
        } else {
            require(tradeToken.balanceOf(msg.sender) >= _amount, string(abi.encodePacked("insufficient ", tradeToken.symbol())));
        }

        uint256 residualAmount = matchOrders(_isBuy, _amount, _price);
        if (residualAmount != 0) {
            insertOrder(_isBuy, residualAmount, _price);
        }

        emit PlaceOrder(_isBuy, msg.sender, _price, _amount);
    }

    function matchOrders(bool _isBuy, uint256 _price, uint256 _amount) internal returns (uint256 _residualAmount) {
        uint256 edgeOrderId = _isBuy ? lowestSellOrderId : highestBuyOrderId;
        Order memory edgeOrder = orderById[edgeOrderId];
        uint256 residualAmount = _amount;

        bool canExecute = _isBuy ? edgeOrder.price <= _price : edgeOrder.price >= _price;

        while (canExecute) {
            if (edgeOrder.amount > residualAmount) {
                orderById[edgeOrderId].amount -= residualAmount;
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
                delete orderById[edgeOrderId];
                edgeOrderId = nextEdgeOrderId;
                edgeOrder = orderById[edgeOrderId];
            }
            canExecute = _isBuy ? edgeOrder.price <= _price : edgeOrder.price >= _price;
        }
        return residualAmount;
    }

    function insertOrder(bool _isBuy, uint256 _price, uint256 _amount) internal {
        uint256 currOrderId = _isBuy ? highestBuyOrderId: lowestSellOrderId;
        Order memory currOrder = orderById[currOrderId];
        Order memory nextOrder = orderById[currOrder.nextOrderId];
        bool shouldInsert = _isBuy ? _price > nextOrder.price : _price < nextOrder.price;
        // loop until find the correct place to insert
        while (!shouldInsert) {
            currOrderId = currOrder.nextOrderId;
            currOrder = nextOrder;
            nextOrder = orderById[currOrder.nextOrderId];
            shouldInsert = _isBuy ? _price > nextOrder.price : _price < nextOrder.price;
        }
        // insert the order
        orderById[orderIdCounter] = Order(msg.sender, _price, _amount, currOrder.nextOrderId);
        orderById[currOrderId].nextOrderId = orderIdCounter;
        orderIdCounter += 1;
    }

    function executeOrder(address _buyer, address _seller, uint256 _price, uint256 _amount) internal {
        // transfer the token
    }
    function getExecutionPrice(uint256 _buyPrice, uint256 _sellPrice) pure internal returns (uint256) {
        return (_buyPrice + _sellPrice) / 2;
    }
}
