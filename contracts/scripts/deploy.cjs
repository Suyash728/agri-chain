// contracts/scripts/deploy.cjs
const { ethers } = require("hardhat");

async function main() {
  const AgriChainCore = await ethers.getContractFactory("AgriChainCore");
  const contract = await AgriChainCore.deploy();
  console.log("Contract address:", contract.address);
  console.log("ABI:", contract.interface.format("ethers5"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
