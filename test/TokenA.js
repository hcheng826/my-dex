// This is an exmaple test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require("chai");

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` recieves the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("TokenA contract", function () {
  // Mocha has four functions that let you hook into the the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let TokenA;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  const initSupply = 10000;
  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    TokenA = await ethers.getContractFactory("TokenA");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    TokenA = await TokenA.deploy(initSupply);

    // We can interact with the contract by calling `TokenA.method()`
    await TokenA.deployed();
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await TokenA.balanceOf(owner.address);
      expect(await TokenA.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await TokenA.transfer(addr1.address, 50);
      const addr1Balance = await TokenA.balanceOf(
        addr1.address
      );
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await TokenA.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await TokenA.balanceOf(
        addr2.address
      );
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn\'t have enough tokens", async function () {
      const initialOwnerBalance = await TokenA.balanceOf(
        owner.address
      );

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        TokenA.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await TokenA.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await TokenA.balanceOf(
        owner.address
      );

      // Transfer 100 tokens from owner to addr1.
      await TokenA.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2.
      await TokenA.transfer(addr2.address, 50);

      // Check balances.
      const finalOwnerBalance = await TokenA.balanceOf(
        owner.address
      );
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);

      const addr1Balance = await TokenA.balanceOf(
        addr1.address
      );
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await TokenA.balanceOf(
        addr2.address
      );
      expect(addr2Balance).to.equal(50);
    });
  });
});
