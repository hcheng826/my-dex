# My DEX

A DEX for practicing Dapp development using hardhat framework.

Try it out at https://mydex-b4a41.web.app/ 

Please use Ropsten Testnet.

![image](https://user-images.githubusercontent.com/23033847/152347386-c8a2bc6c-0c05-4492-9ac9-d01701f2f8a3.png)

![image](https://user-images.githubusercontent.com/23033847/152347436-a1d5d20f-581d-4ae6-a708-01180faddf9e.png)


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
