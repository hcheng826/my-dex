// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

let TokenA = {
  contractName: "TokenA",
  initSupply: 1000000000,
};

let TokenB = {
  contractName: "TokenB",
  initSupply: 1000000000,
};

let OrderBook = {
  contractName: "OrderBook",
}

contracts = [TokenA, TokenB, OrderBook];
// const secrets = require('../secrets.json');

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is avaialble in the global scope

  // deploy with default first address of local hardhat test account
  const [deployer] = await ethers.getSigners();
  // deploy with your own address
  // const deployer = new ethers.Wallet(`0x${secrets.ACCOUNT_DEV_PRIVATE_KEY}`, new ethers.providers.JsonRpcProvider());
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  TokenA.contract = await ethers.getContractFactory(TokenA.contractName, deployer);
  TokenA.contract = await TokenA.contract.deploy(TokenA.initSupply);
  await TokenA.contract.deployed();
  console.log(`${TokenA.contractName} contract address:`, TokenA.contract.address);

  TokenB.contract = await ethers.getContractFactory(TokenB.contractName, deployer);
  TokenB.contract = await TokenB.contract.deploy(TokenB.initSupply);
  await TokenB.contract.deployed();
  console.log(`${TokenB.contractName} contract address:`, TokenB.contract.address);

  OrderBook.contract = await ethers.getContractFactory(OrderBook.contractName, deployer);
  OrderBook.contract = await OrderBook.contract.deploy(TokenA.contract.address, TokenB.contract.address);
  await OrderBook.contract.deployed();
  console.log(`${OrderBook.contractName} contract address:`, OrderBook.contract.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles([TokenA, TokenB, OrderBook]);
}

function saveFrontendFiles(contracts) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  contractAddress = {};
  contracts.forEach((contract) => {
    const ContractArtifact = artifacts.readArtifactSync(`${contract.contractName}`);

    fs.writeFileSync(
      contractsDir + `/${contract.contractName}.json`,
      JSON.stringify(ContractArtifact, null, 2)
    );

    contractAddress[contract.contractName] = contract.contract.address;
  });

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify(contractAddress, undefined, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
