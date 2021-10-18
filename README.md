### Init

Installs the latest dependieces
```
npm install
```

Ensure that the latest truffle is installed. https://www.trufflesuite.com/docs/truffle/getting-started/installation
```
yarn add -g truffle
```

Create a .env folder and enter the required parameters
```
INFURA_ID=XXX
ETHERSCAN_API_KEY=XXX
LEGENDS_OF_VENARI_RINKEBY_PRIVATE_KEY=XXX
LEGENDS_OF_VENARI_LIVE_PRIVATE_KEY=XXX
```

### Truffle commands

Compiles the latest contracts
```
yarn compile
```

Deploys to Rinkeby
```
yarn deploy-rinkeby
```

Verifies contract on etherscan
```
truffle run verify ContractName --network rinkeby
```

## Latest Contract Deployments

### Rinkeyb
https://rinkeby.etherscan.io/address/0x03c0279b390a78321aebaaa421ae8ca2499cb7c8