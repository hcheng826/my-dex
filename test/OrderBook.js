const { expect } = require("chai");

describe('OrderBook contract', () => {
    let TokenA, TokenB;
    let OrderBook;
    let getOrderById;
    const initSupplyA = 10000;
    const initSupplyB = 10000;

    async function getOrders(contract, headOrderId) {
        const headOrder = await contract.getOrderById(headOrderId);
        if(headOrder.amount.toNumber() == 0) { return []; }
        let orders = [headOrder];
        let currOrder = await contract.getOrderById(headOrder.nextOrderId);
        while (currOrder.amount.toNumber() != 0) {
            orders.push(currOrder);
            currOrder = getOrderById[currOrder.nextOrderId.toNumber()];
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
            const tx = await OrderBook.placeOrder(true, 10, 2);
            const rc = await tx.wait();
            const orderPlaced = rc.events.find(event => event.event === 'OrderPlaced');

            expect(orderPlaced.args._isBuy).to.eql(true);
            expect(orderPlaced.args._maker).to.eql(owner.address);
            expect(orderPlaced.args._price.toNumber()).to.eql(10);
            expect(orderPlaced.args._amount.toNumber()).to.eql(2);

            const highestBuyOrderId = (await OrderBook.highestBuyOrderId()).toNumber();

            orders = await getOrders(OrderBook, highestBuyOrderId);
            expect(orders.length).to.eql(1);
            expect(orders[0].maker).to.eql(owner.address);
            expect(orders[0].price.toNumber()).to.eql(10);
            expect(orders[0].amount.toNumber()).to.eql(2);
            expect(orders[0].nextOrderId.toNumber()).to.eql(0);
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
