// contracts/scripts/deploy.cjs
const { ethers } = require("hardhat");

async function main() {
  const AgriChainCore = await ethers.getContractFactory("AgriChainCore");
  const contract = await AgriChainCore.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("Contract address:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
