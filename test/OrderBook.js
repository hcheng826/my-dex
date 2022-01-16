const { expect } = require("chai");

describe('OrderBook contract', () => {
    let TokenA, TokenB;
    let OrderBook;
    let getOrderById;
    const initSupplyA = 10000;
    const initSupplyB = 10000;

    async function getOrders(headOrderId) {
        const headOrder = await getOrderById(headOrderId);
        if(headOrder.amount.toNumber() == 0) { return []; }
        let orders = [headOrder];
        let currOrder = await getOrderById(headOrder.nextOrderId);
        while (currOrder.amount.toNumber() != 0) {
            orders.push(currOrder);
            currOrder = await getOrderById(currOrder.nextOrderId.toNumber());
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

        getOrderById = async (id) => { return await OrderBook.getOrderById(id); };

        // TokenA.approve(OrderBook.address, (await TokenA.balanceOf(owner)).toNumber());
        // TokenB.approve(OrderBook.address, (await TokenB.balanceOf(owner)).toNumber());
        TokenA.approve(OrderBook.address, initSupplyA);
        TokenB.approve(OrderBook.address, initSupplyB);

        TokenA.transfer(addr1.address, 100);
        TokenB.transfer(addr1.address, 100);
    });

    describe('Place order', async () => {
        it('can place buy order', async () => {
            const tx = await OrderBook.placeBuyOrder(10, 2);
            const rc = await tx.wait();
            const orderPlaced = rc.events.find(event => event.event === 'OrderPlaced');
            expect(orderPlaced.args._isBuy).to.eql(true);
            expect(orderPlaced.args._maker).to.eql(owner.address);
            expect(orderPlaced.args._price.toNumber()).to.eql(10);
            expect(orderPlaced.args._amount.toNumber()).to.eql(2);

            const highestBuyOrderId = (await OrderBook.highestBuyOrderId()).toNumber();
            orders = await getOrders(highestBuyOrderId);
            expect(orders.length).to.eql(1);
            expect(orders[0].maker).to.eql(owner.address);
            expect(orders[0].price.toNumber()).to.eql(10);
            expect(orders[0].amount.toNumber()).to.eql(2);
            expect(orders[0].nextOrderId.toNumber()).to.eql(0);
        });
        it('can place sell order', async () => {
            const tx = await OrderBook.placeSellOrder(10, 2);
            const rc = await tx.wait();
            const orderPlaced = rc.events.find(event => event.event === 'OrderPlaced');
            expect(orderPlaced.args._isBuy).to.eql(false);
            expect(orderPlaced.args._maker).to.eql(owner.address);
            expect(orderPlaced.args._price.toNumber()).to.eql(10);
            expect(orderPlaced.args._amount.toNumber()).to.eql(2);

            const lowestSellOrderId = (await OrderBook.lowestSellOrderId()).toNumber();
            orders = await getOrders(lowestSellOrderId);
            expect(orders.length).to.eql(1);
            expect(orders[0].maker).to.eql(owner.address);
            expect(orders[0].price.toNumber()).to.eql(10);
            expect(orders[0].amount.toNumber()).to.eql(2);
            expect(orders[0].nextOrderId.toNumber()).to.eql(1);
        });
        it('cannot place order when insufficient amount', async () => {
            expect(OrderBook.connect(addr2).placeBuyOrder(10, 2)).to.be.revertedWith('insufficient ' + await TokenB.symbol());
            expect(OrderBook.connect(addr2).placeSellOrder(10, 2)).to.be.revertedWith('insufficient ' + await TokenA.symbol());
        });
        it('can insert buy order', async () => {
            await OrderBook.placeBuyOrder(10, 2);
            await OrderBook.placeBuyOrder(12, 3);
            await OrderBook.placeBuyOrder(11, 1);

            const highestBuyOrderId = (await OrderBook.highestBuyOrderId()).toNumber();
            [order1, order2, order3] = await getOrders(highestBuyOrderId);
            expect(order1.price.toNumber()).to.eql(12);
            expect(order2.price.toNumber()).to.eql(11);
            expect(order3.price.toNumber()).to.eql(10);
            expect(order1.amount.toNumber()).to.eql(3);
            expect(order2.amount.toNumber()).to.eql(1);
            expect(order3.amount.toNumber()).to.eql(2);
        });
        it('can insert sell order', async () => {
            await OrderBook.placeSellOrder(10, 2);
            await OrderBook.placeSellOrder(12, 3);
            await OrderBook.placeSellOrder(11, 1);

            const lowestSellOrderId = (await OrderBook.lowestSellOrderId()).toNumber();
            [order1, order2, order3] = await getOrders(lowestSellOrderId);
            expect(order1.price.toNumber()).to.eql(10);
            expect(order2.price.toNumber()).to.eql(11);
            expect(order3.price.toNumber()).to.eql(12);
            expect(order1.amount.toNumber()).to.eql(2);
            expect(order2.amount.toNumber()).to.eql(1);
            expect(order3.amount.toNumber()).to.eql(3);
        });
    });
    xdescribe('Consume order', async () => {

        it('can take 1 buy order', async () => {
        });
        it('can take 1+ buy order', async () => {});
        it('can take 1 sell order', async () => {});
        it('can take 1+ sell order', async () => {});
    });
    xdescribe('Mix: match and place order', async () => {
        it('can execute partial buy order and place residual amount', async () => {});
        it('can execute partial sell order and place residual amount', async () => {});
    });
});
