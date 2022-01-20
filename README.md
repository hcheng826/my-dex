# My DEX

A DEX for practicing Dapp development using hardhat framework.

![image](https://user-images.githubusercontent.com/23033847/150377611-63011978-472a-47d9-ab02-3920376977a6.png)


## Features
- Order book
## Future direction
- Cancel order
- Native gas token
- AMM
- Liquidity mining
- New token listing

## Local build

under `my-dex/`
```bash
# start local test network
npx hardhat node

# deploy to local network
npx hardhat --network localhost run scripts/deploy.js

# faucet - transfer 100 Token A, 100 Token and 1 ETH to your address
npx hardhat --network localhost faucet <your wallet address>
```

Go to `frontend/`
```bash
cd frontend/
npm install
npm run start
```

Test it out at http://localhost:3000 of your browser. Connect MetaMask to `localhost:8545` network.


refer to https://github.com/nomiclabs/hardhat-hackathon-boilerplate
