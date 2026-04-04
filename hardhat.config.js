require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.28",
  networks: {
    // Local development network (already configured by default)
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Realistic Demo Setup: Sepolia Testnet
    // Requires SEPOLIA_RPC_URL and PRIVATE_KEY in .env
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Ganache GUI network (port 7545)
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
  },
};

module.exports = config;
