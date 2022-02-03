# ref: https://hardhat.org/tutorial/hackathon-boilerplate-project.html

## under root
# unit test
npx hardhat test

# start local test network
npx hardhat node
# deploy to local network
npx hardhat --network localhost run scripts/deploy.js

# faucet # 0xdc2aa403f3EFd76bcaFED75f644B2b353CBea9FF
npx hardhat --network localhost faucet <your address>

## under frontend/
# start app
cd frontend/
npm install
npm run start

# firebase
firebase emulators:start
firebase deploy --only hosting
