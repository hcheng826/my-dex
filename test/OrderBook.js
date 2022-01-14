const { expect } = require("chai");

describe('OrderBook contract', () => {
    let TokenA, TokenB;
    let OrderBook;
    let getOrderById;
    const initSupplyA = 10000;
    const initSupplyB = 10000;

    function getOrders(headOrder) {
        if(headOrder.amount == 0) { return []; }
        let orders = [headOrder];
        currOrder = getOrderById[headOrder.nextOrderId];
        while (currOrder.amount != 0) {
            orders.push(currOrder);
            currOrder = getOrderById[currOrder.nextOrderId];
        }
        return orders;
    }

    beforeEach(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        TokenA = await ethers.getContractFactory('TokenA');
        TokenA = await TokenA.deploy(initSupplyA);
        await TokenA.deployed();

        TokenB = await ethers.getContractFactory('TokenB');
        TokenB = await TokenB.deploy(initSupplyB);
        await TokenB.deployed();

        OrderBook = await ethers.getContractFactory('OrderBook');
        OrderBook = await OrderBook.deploy(TokenA.address, TokenB.address);
        await OrderBook.deployed();

        getOrderById = await OrderBook.getOrderById;

        TokenA.approve(OrderBook.address, initSupplyA);
        TokenB.approve(OrderBook.address, initSupplyB);
    });

    describe('Place order', async () => {
        it('can place buy order', async () => {
            console.log('owner: ', owner.address);
            console.log('addr1:', addr1.address);
            console.log('TokenA: ', TokenA.address);
            console.log('TokenB: ', TokenB.address);
            console.log('OrderBook: ', OrderBook.address);

            console.log((await TokenA.balanceOf(owner.address)).toNumber());
            console.log((await TokenB.balanceOf(owner.address)).toNumber());

            // console.log((await OrderBook.getBaseTokenBalance(owner.address)).toNumber());

            const tx = await OrderBook.placeOrder(true, 1, 1);
            console.log(tx);
            console.log(await tx.wait());
            // orders = getOrders(OrderBook.highestBuyOrderId);
            // console.log(orders);
            // expect(orders.length).to.equal(1);
        });
        it('can place sell order', async () => {});
        it('cannot place order when insufficient amount', async () => {});
        it('can insert buy order', async () => {});
        it('can insert buy order', async () => {});
    });
    xdescribe('Consume order', async () => {
        it('can take 1 buy order', async () => {});
        it('can take 1+ buy order', async () => {});
        it('can take 1 sell order', async () => {});
        it('can take 1+ sell order', async () => {});
    });
    xdescribe('Match and place order', async () => {
        it('can execute partial buy order and place residual amount', async () => {});
        it('can execute partial sell order and place residual amount', async () => {});
    });
});
