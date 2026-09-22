// contracts/scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const AgriChainCore = await ethers.getContractFactory("AgriChainCore");
  const contract = await AgriChainCore.deploy();
  await contract.deployed();
  console.log("Contract address:", contract.address);
  console.log("ABI:", contract.interface.format("ethers5"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
