require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.28", // Upgraded from 0.8.20 to match the contract
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts"
  }
};
