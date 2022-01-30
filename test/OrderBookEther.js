const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('OrderBookEther contract', () => {
    let TokenA;
    let OrderBookEther;
    let getOrderById, getHighestBuyOrderId, getLowestSellOrderId, getBuyOrders, getSellOrders;
    let ownerBalance, addr1Balacne, contractBalacne;

    const initSupplyA = 10000;

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

        OrderBookEther = await ethers.getContractFactory('OrderBookEther');
        OrderBookEther = await OrderBookEther.deploy(TokenA.address);
        await OrderBookEther.deployed();

        getHighestBuyOrderId = async () => { return (await OrderBookEther.highestBuyOrderId()).toNumber() };
        getLowestSellOrderId = async () => { return (await OrderBookEther.lowestSellOrderId()).toNumber() };
        getBuyOrders = async () => {
            const highestBuyOrderId = await getHighestBuyOrderId();
            return await getOrders(highestBuyOrderId);
        };
        getSellOrders = async () => {
            const lowestSellOrderId = await getLowestSellOrderId();
            return await getOrders(lowestSellOrderId);
        };
        getOrderById = async (id) => { return await OrderBookEther.getOrderById(id); };

        TokenA.transfer(addr1.address, 100);
        TokenA.approve(OrderBookEther.address, initSupplyA);
        TokenA.connect(addr1).approve(OrderBookEther.address, initSupplyA);
    });

    describe('Place order', async () => {
        it('can place buy order', async () => {
            const tx = await OrderBookEther.placeBuyOrder(10, 2, { value: ethers.utils.parseUnits('20', 'gwei') });
            const rc = await tx.wait();
            const orderPlaced = rc.events.find(event => event.event === 'OrderPlaced');
            expect(orderPlaced.args._isBuy).to.eql(true);
            expect(orderPlaced.args._maker).to.eql(owner.address);
            expect(orderPlaced.args._price.toNumber()).to.eql(10);
            expect(orderPlaced.args._amount.toNumber()).to.eql(2);

            orders = await getBuyOrders();
            expect(orders.length).to.eql(1);
            expect(orders[0].maker).to.eql(owner.address);
            expect(orders[0].price.toNumber()).to.eql(10);
            expect(orders[0].amount.toNumber()).to.eql(2);
            expect(orders[0].nextOrderId.toNumber()).to.eql(0);
        });
        it('can place sell order', async () => {
            const tx = await OrderBookEther.placeSellOrder(10, 2);
            const rc = await tx.wait();
            const orderPlaced = rc.events.find(event => event.event === 'OrderPlaced');
            expect(orderPlaced.args._isBuy).to.eql(false);
            expect(orderPlaced.args._maker).to.eql(owner.address);
            expect(orderPlaced.args._price.toNumber()).to.eql(10);
            expect(orderPlaced.args._amount.toNumber()).to.eql(2);

            orders = await getSellOrders();
            expect(orders.length).to.eql(1);
            expect(orders[0].maker).to.eql(owner.address);
            expect(orders[0].price.toNumber()).to.eql(10);
            expect(orders[0].amount.toNumber()).to.eql(2);
            expect(orders[0].nextOrderId.toNumber()).to.eql(1);
        });
        it('cannot place order when insufficient amount', async () => {
            // expect(OrderBookEther.connect(addr2).placeSellOrder(10, 2)).to.be.revertedWith('insufficient ' + await TokenA.symbol()); // not working - https://github.com/EthWorks/Waffle/issues/95
            expect(OrderBookEther.connect(addr2).placeSellOrder(10, 2)).to.be.reverted;
        });
        it('can insert buy order', async () => {
            await OrderBookEther.placeBuyOrder(10, 2, { value: ethers.utils.parseUnits('20', 'gwei') });
            await OrderBookEther.placeBuyOrder(12, 3, { value: ethers.utils.parseUnits('36', 'gwei') });
            await OrderBookEther.placeBuyOrder(11, 1, { value: ethers.utils.parseUnits('11', 'gwei') });

            const highestBuyOrderId = (await OrderBookEther.highestBuyOrderId()).toNumber();
            [order1, order2, order3] = await getOrders(highestBuyOrderId);
            expect(order1.price.toNumber()).to.eql(12);
            expect(order2.price.toNumber()).to.eql(11);
            expect(order3.price.toNumber()).to.eql(10);
            expect(order1.amount.toNumber()).to.eql(3);
            expect(order2.amount.toNumber()).to.eql(1);
            expect(order3.amount.toNumber()).to.eql(2);
            orders = await getBuyOrders();
            expect(orders.length).to.eql(3);
        });
        it('can insert sell order', async () => {
            await OrderBookEther.placeSellOrder(10, 2);
            await OrderBookEther.placeSellOrder(12, 3);
            await OrderBookEther.placeSellOrder(11, 1);

            const lowestSellOrderId = (await OrderBookEther.lowestSellOrderId()).toNumber();
            [order1, order2, order3] = await getOrders(lowestSellOrderId);
            expect(order1.price.toNumber()).to.eql(10);
            expect(order2.price.toNumber()).to.eql(11);
            expect(order3.price.toNumber()).to.eql(12);
            expect(order1.amount.toNumber()).to.eql(2);
            expect(order2.amount.toNumber()).to.eql(1);
            expect(order3.amount.toNumber()).to.eql(3);
            orders = await getSellOrders();
            expect(orders.length).to.eql(3);
        });
    });
    describe('Consume order', async () => {
        it('can take 1 buy order with same price', async () => {
            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            // console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            // console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            // console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));

            gasUsed = [];
            await OrderBookEther.placeBuyOrder(1, 2, { value: ethers.utils.parseEther('2') });

            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            // console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            // console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            // console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));

            await OrderBookEther.connect(addr1).placeSellOrder(1, 2);

            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            // console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            // console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            // console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));

            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9902);
            expect((await TokenA.balanceOf(addr1.address)).toNumber()).to.eql(98);
            expect(Math.round(ethers.utils.formatEther(ownerBalance))).to.eql(9998);
            expect(Math.round(ethers.utils.formatEther(addr1Balacne))).to.eql(10002);

            orders = await getBuyOrders();
            expect(orders.length).to.eql(0);
        });
        it('can take 1 buy order with different price', async () => {
            await OrderBookEther.placeBuyOrder(12, 2, { value: ethers.utils.parseEther('24') });
            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            // console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            // console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            // console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));

            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9900);
            expect(Math.round(ethers.utils.formatEther(ownerBalance))).to.eql(9974);
            expect(Math.round(ethers.utils.formatEther(contractBalacne))).to.eql(24);

            await OrderBookEther.connect(addr1).placeSellOrder(10, 2);

            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            // console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            // console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            // console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));

            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9902);
            expect((await TokenA.balanceOf(addr1.address)).toNumber()).to.eql(98);
            expect(Math.round(ethers.utils.formatEther(ownerBalance))).to.eql(9976);
            expect(Math.round(ethers.utils.formatEther(addr1Balacne))).to.eql(10024);
            expect(Math.round(ethers.utils.formatEther(contractBalacne))).to.eql(0);

            orders = await getBuyOrders();
            expect(orders.length).to.eql(0);
        });
        it('can take 1+ buy order', async () => {
            await OrderBookEther.placeBuyOrder(10, 2, { value: ethers.utils.parseEther('20') });
            await OrderBookEther.placeBuyOrder(12, 3, { value: ethers.utils.parseEther('36') });
            await OrderBookEther.connect(addr1).placeSellOrder(9, 5);

            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));

            expect(Math.round(ethers.utils.formatEther(ownerBalance))).to.eql(9928);
            expect(Math.round(ethers.utils.formatEther(addr1Balacne))).to.eql(10072);
            expect(Math.round(ethers.utils.formatEther(contractBalacne))).to.eql(0);
            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9905);
            expect((await TokenA.balanceOf(addr1.address)).toNumber()).to.eql(95);

            orders = await getBuyOrders();
            expect(orders.length).to.eql(0);
        });
        xit('can take 1 sell order with different price', async () => {
            await OrderBookEther.placeSellOrder(10, 2);
            await OrderBookEther.connect(addr1).placeBuyOrder(12, 2, { value: ethers.utils.parseEther('24') });

            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));

            expect(Math.round(ethers.utils.formatEther(ownerBalance))).to.eql(9950);
            expect(Math.round(ethers.utils.formatEther(addr1Balacne))).to.eql(10050);
            expect(Math.round(ethers.utils.formatEther(contractBalacne))).to.eql(0);
            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9898);
            expect((await TokenA.balanceOf(addr1.address)).toNumber()).to.eql(102);

            orders = await getSellOrders();
            expect(orders.length).to.eql(0);
        });
        it('can take 1+ sell order', async () => {
            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));
            await OrderBookEther.placeSellOrder(10, 2);
            await OrderBookEther.placeSellOrder(12, 3);
            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));

            await OrderBookEther.connect(addr1).placeBuyOrder(13, 5, { value: ethers.utils.parseEther('65')});
            ownerBalance = (await ethers.provider.getBalance(owner.address));
            addr1Balacne = (await ethers.provider.getBalance(addr1.address));
            contractBalacne = (await ethers.provider.getBalance(OrderBookEther.address));
            console.log('ownerBalance in Ether: ', ethers.utils.formatEther(ownerBalance));
            console.log('addr1Balacne in Ether: ', ethers.utils.formatEther(addr1Balacne));
            console.log('contractBalacne in Ether: ', ethers.utils.formatEther(contractBalacne));

            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9895);
            expect((await TokenA.balanceOf(addr1.address)).toNumber()).to.eql(105);

            orders = await getSellOrders();
            expect(orders.length).to.eql(0);
        });
    });
    xdescribe('Mix: match and place order', async () => {
        it('can execute partial buy order and place residual amount', async () => {
            await OrderBookEther.placeSellOrder(10, 2);
            await OrderBookEther.connect(addr1).placeBuyOrder(13, 5);

            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9898);
            expect((await TokenB.balanceOf(owner.address)).toNumber()).to.eql(9922);
            expect((await TokenA.balanceOf(addr1.address)).toNumber()).to.eql(102);
            expect((await TokenB.balanceOf(addr1.address)).toNumber()).to.eql(39);
            expect((await TokenA.balanceOf(OrderBookEther.address)).toNumber()).to.eql(0);
            expect((await TokenB.balanceOf(OrderBookEther.address)).toNumber()).to.eql(39);

            sellOrders = await getSellOrders();
            expect(sellOrders.length).to.eql(0);
            buyOrders = await getBuyOrders();
            expect(buyOrders.length).to.eql(1);
            expect(buyOrders[0].maker).to.eql(addr1.address);
            expect(buyOrders[0].price.toNumber()).to.eql(13);
            expect(buyOrders[0].amount.toNumber()).to.eql(3);
        });
        it('can execute partial sell order and place residual amount', async () => {
            await OrderBookEther.placeBuyOrder(13, 2);
            await OrderBookEther.connect(addr1).placeSellOrder(10, 5);

            expect((await TokenA.balanceOf(owner.address)).toNumber()).to.eql(9902);
            expect((await TokenB.balanceOf(owner.address)).toNumber()).to.eql(9878);
            expect((await TokenA.balanceOf(addr1.address)).toNumber()).to.eql(95);
            expect((await TokenB.balanceOf(addr1.address)).toNumber()).to.eql(122);
            expect((await TokenA.balanceOf(OrderBookEther.address)).toNumber()).to.eql(3);
            expect((await TokenB.balanceOf(OrderBookEther.address)).toNumber()).to.eql(0);

            sellOrders = await getSellOrders();
            expect(sellOrders.length).to.eql(1);
            expect(sellOrders[0].maker).to.eql(addr1.address);
            expect(sellOrders[0].price.toNumber()).to.eql(10);
            expect(sellOrders[0].amount.toNumber()).to.eql(3);
            buyOrders = await getBuyOrders();
            expect(buyOrders.length).to.eql(0);
        });
    });
});

            // console.log((await TokenA.balanceOf(owner.address)).toNumber());
            // console.log((await TokenB.balanceOf(owner.address)).toNumber());
            // console.log((await TokenA.balanceOf(addr1.address)).toNumber());
            // console.log((await TokenB.balanceOf(addr1.address)).toNumber());
            // console.log((await TokenA.balanceOf(OrderBookEther.address)).toNumber());
            // console.log((await TokenB.balanceOf(OrderBookEther.address)).toNumber());
