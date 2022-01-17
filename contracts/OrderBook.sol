// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IOrderBook } from "./interfaces/IOrderBook.sol";

import "hardhat/console.sol";

contract OrderBook is IOrderBook {
    ERC20 public tradeToken;
    ERC20 public baseToken;

    mapping(uint256 => Order) public orderById;
    uint256 orderIdCounter;
    uint256 public highestBuyOrderId;
    uint256 public lowestSellOrderId;

    event OrderPlaced(bool _isBuy, address _maker, uint _price, uint _amount);
    event OrderExecuted(bool _isBuy, address _maker, address _taker, uint _price, uint _amount);

    constructor(address _tradeTokenAddress, address _baseTokenAddress) {
        tradeToken = ERC20(_tradeTokenAddress);
        baseToken = ERC20(_baseTokenAddress);
        orderById[0] = Order(msg.sender, 0, 0, 0); // highest buy
        orderById[1] = Order(msg.sender, 2^256-1, 0, 1); // lowest sell
        highestBuyOrderId = 0; // dummy buy order
        lowestSellOrderId = 1; // dummy sell order
        orderIdCounter = 2;
    }

    modifier positivePriceAmount(uint256 _price, uint256 _amount) {
        require(_price > 0 && _amount > 0, "invalid price or amount");
        _;
    }

    function getOrderById(uint256 _id) external view returns (Order memory) {
        return orderById[_id];
    }

    function placeBuyOrder(uint256 _price, uint256 _amount) external override positivePriceAmount(_price, _amount) {
        placeOrder(true, _price, _amount);
    }

    function placeSellOrder(uint256 _price, uint256 _amount) external override positivePriceAmount(_price, _amount) {
        placeOrder(false, _price, _amount);
    }

    function placeOrder(bool _isBuy, uint256 _price, uint256 _amount) internal {
        if (_isBuy) {
            require(baseToken.balanceOf(msg.sender) >= _amount*_price, string(abi.encodePacked("insufficient ", baseToken.symbol())));
        } else {
            require(tradeToken.balanceOf(msg.sender) >= _amount, string(abi.encodePacked("insufficient ", tradeToken.symbol())));
        }

        uint256 residualAmount = matchOrders(_isBuy, _price, _amount);
        if (residualAmount != 0) {
            insertOrder(_isBuy, _price, residualAmount);
        }
    }

    function matchOrders(bool _isBuy, uint256 _price, uint256 _amount) internal returns (uint256 _residualAmount) {
        uint256 edgeOrderId = _isBuy ? lowestSellOrderId : highestBuyOrderId;
        Order memory edgeOrder = orderById[edgeOrderId];
        uint256 residualAmount = _amount;

        bool canExecute = _isBuy ? edgeOrder.price <= _price : edgeOrder.price >= _price;

        while (canExecute) {
            if (edgeOrder.amount > residualAmount) {
                orderById[edgeOrderId].amount -= residualAmount;
                executeOrder(_isBuy, edgeOrder, msg.sender, edgeOrder.maker, getExecutionPrice(_price, edgeOrder.price), residualAmount);
                return 0;
            } else {
                residualAmount -= edgeOrder.amount;
                executeOrder(_isBuy, edgeOrder, msg.sender, edgeOrder.maker, getExecutionPrice(_price, edgeOrder.price), edgeOrder.amount);

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
        uint256 headOrderId = _isBuy ? highestBuyOrderId: lowestSellOrderId;
        ERC20 makerToken = _isBuy ? baseToken : tradeToken;

        Order memory headOrder = orderById[headOrderId];
        bool shouldInsertHead = _isBuy ? _price > headOrder.price : _price < headOrder.price;
        uint256 newOrderId = orderIdCounter;
        if (shouldInsertHead) {
            orderById[newOrderId] = Order(msg.sender, _price, _amount, headOrderId);
            if (_isBuy) {
                highestBuyOrderId = newOrderId;
            } else {
                lowestSellOrderId = newOrderId;
            }
            orderIdCounter += 1;
            emit OrderPlaced(_isBuy, msg.sender, _price, _amount);
        } else {
            uint256 currOrderId = headOrderId;
            Order memory currOrder = orderById[headOrderId];
            Order memory nextOrder = orderById[currOrder.nextOrderId];
            bool shouldInsert = _isBuy ? _price > nextOrder.price : _price < nextOrder.price;
            // loop until find the correct place to insert
            while (!shouldInsert) {
                currOrderId = currOrder.nextOrderId;
                currOrder = nextOrder;
                nextOrder = orderById[currOrder.nextOrderId];
                shouldInsert = _isBuy ? _price > nextOrder.price : _price < nextOrder.price;
            }
            orderById[orderIdCounter] = Order(msg.sender, _price, _amount, currOrder.nextOrderId);
            orderById[currOrderId].nextOrderId = orderIdCounter;
        }
        uint256 transferAmount = _isBuy ? _amount*_price : _amount;
        makerToken.transferFrom(msg.sender, address(this), transferAmount);
        orderIdCounter += 1;

        emit OrderPlaced(_isBuy, msg.sender, _price, _amount);
    }

    function executeOrder(bool _isBuy, Order memory _takenOrder, address _taker, address _maker, uint256 _price, uint256 _amount) internal {
        if (_isBuy) {
            tradeToken.transfer(_taker, _amount);
            baseToken.transferFrom(_taker, _maker, _amount*_price);
        } else {
            uint256 makerLockedAmount = _takenOrder.amount*_takenOrder.price;
            baseToken.transfer(_taker, _amount*_price);
            tradeToken.transferFrom(_taker, _maker, _amount);
            baseToken.transfer(_maker, makerLockedAmount-_amount*_price);
        }

        emit OrderExecuted(_isBuy, _maker, _taker, _price, _amount);
    }

    function getExecutionPrice(uint256 _buyPrice, uint256 _sellPrice) pure internal returns (uint256) {
        return (_buyPrice + _sellPrice) / 2;
    }
}
