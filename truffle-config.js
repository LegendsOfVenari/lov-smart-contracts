const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  plugins: ["truffle-plugin-verify"],

  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
  },

  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
      coinmarketcap: `${process.env.CMC_API_KEY}`,
      excludeContracts: ["Migrations"],
      gasPrice: "200",
    },
  },

  networks: {
    live: {
      provider: function () {
        return new HDWalletProvider(
          `${process.env.LEGENDS_OF_VENARI_LIVE_PRIVATE_KEY}`,
          `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`
        );
      },
      gas: 2250000, // adjust per contract
      gasPrice: 120000000000, // 120 gwei
      network_id: 1,
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(
          `${process.env.LEGENDS_OF_VENARI_RINKEBY_PRIVATE_KEY}`,
          `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`
        );
      },
      network_id: 4,
    },
    kovan: {
      provider: function () {
        return new HDWalletProvider(
          `${process.env.LEGENDS_OF_VENARI_RINKEBY_PRIVATE_KEY}`,
          `https://kovan.infura.io/v3/${process.env.INFURA_ID}`
        );
      },
      network_id: 42,
    },
    matic: {
      provider: function () {
        return new HDWalletProvider(
          `${process.env.LEGENDS_OF_VENARI_RINKEBY_PRIVATE_KEY}`,
          `https://rpc-mumbai.matic.today`
        );
      },
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        }
      },
    },
  },
};
