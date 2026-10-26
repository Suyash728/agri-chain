const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("===============================================================");
  console.log(` DEPLOYING MODULAR SMART CONTRACTS TO: ${network.name.toUpperCase()}`);
  console.log(` Deployer Account: ${deployer.address}`);
  console.log("===============================================================\n");

  // 1. Deploy ProductRegistry
  console.log("1. Deploying ProductRegistry...");
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy();
  await productRegistry.waitForDeployment();
  const registryAddr = await productRegistry.getAddress();
  console.log(`   ProductRegistry deployed at: ${registryAddr}`);

  // 2. Deploy CustodyTransfer
  console.log("2. Deploying CustodyTransfer...");
  const CustodyTransfer = await ethers.getContractFactory("CustodyTransfer");
  const custodyTransfer = await CustodyTransfer.deploy();
  await custodyTransfer.waitForDeployment();
  const custodyAddr = await custodyTransfer.getAddress();
  console.log(`   CustodyTransfer deployed at: ${custodyAddr}`);

  // 3. Deploy ColdChainMonitor
  console.log("3. Deploying ColdChainMonitor...");
  const ColdChainMonitor = await ethers.getContractFactory("ColdChainMonitor");
  const coldChainMonitor = await ColdChainMonitor.deploy();
  await coldChainMonitor.waitForDeployment();
  const monitorAddr = await coldChainMonitor.getAddress();
  console.log(`   ColdChainMonitor deployed at: ${monitorAddr}`);

  // 4. Deploy PolicyConfig
  console.log("4. Deploying PolicyConfig...");
  const PolicyConfig = await ethers.getContractFactory("PolicyConfig");
  const policyConfig = await PolicyConfig.deploy();
  await policyConfig.waitForDeployment();
  const policyAddr = await policyConfig.getAddress();
  console.log(`   PolicyConfig deployed at: ${policyAddr}`);

  // 5. Grant Roles to Deployer / Backend account & Default Personas
  console.log("\n5. Granting initial supply-chain roles...");
  const FARMER_ROLE = await productRegistry.FARMER_ROLE();
  const LOGISTICS_ROLE = await custodyTransfer.LOGISTICS_ROLE();
  const RETAILER_ROLE = await custodyTransfer.RETAILER_ROLE();
  const ORACLE_ROLE = await coldChainMonitor.ORACLE_ROLE();

  // Deployer / Relayer gets all roles for automated backend execution
  await (await productRegistry.grantRole(FARMER_ROLE, deployer.address)).wait();
  await (await custodyTransfer.grantRole(FARMER_ROLE, deployer.address)).wait();
  await (await custodyTransfer.grantRole(LOGISTICS_ROLE, deployer.address)).wait();
  await (await custodyTransfer.grantRole(RETAILER_ROLE, deployer.address)).wait();
  await (await coldChainMonitor.grantRole(ORACLE_ROLE, deployer.address)).wait();
  console.log(`   All roles granted to deployer/backend: ${deployer.address}`);

  // Default seeded persona wallet addresses
  const SAFEXPRESS_LOGISTICS_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const PUNE_DARKSTORE_ADDR = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  await (await custodyTransfer.grantRole(LOGISTICS_ROLE, SAFEXPRESS_LOGISTICS_ADDR)).wait();
  console.log(`   LOGISTICS_ROLE granted to Safexpress: ${SAFEXPRESS_LOGISTICS_ADDR}`);

  await (await custodyTransfer.grantRole(RETAILER_ROLE, PUNE_DARKSTORE_ADDR)).wait();
  console.log(`   RETAILER_ROLE granted to Pune Fresh DarkStore: ${PUNE_DARKSTORE_ADDR}`);

  // 6. Set initial policies in PolicyConfig
  console.log("\n6. Seeding initial on-chain crop policies...");
  await (await policyConfig.setPolicy("tomato", 20, 80, 85, 95)).wait(); // 2.0°C to 8.0°C
  await (await policyConfig.setPolicy("mango", 100, 150, 85, 90)).wait(); // 10.0°C to 15.0°C
  await (await policyConfig.setPolicy("wheat", 150, 250, 50, 70)).wait(); // 15.0°C to 25.0°C
  console.log("   Initial policies for tomato, mango, wheat seeded.");

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      ProductRegistry: registryAddr,
      CustodyTransfer: custodyAddr,
      ColdChainMonitor: monitorAddr,
      PolicyConfig: policyAddr
    }
  };

  const outPath = path.join(__dirname, "..", "amoy-deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n[OK] Deployment manifest written to: ${outPath}`);

  // Also write to backend folder for seamless consumption
  const backendOutPath = path.join(__dirname, "..", "..", "backend", "modular-deployments.json");
  fs.writeFileSync(backendOutPath, JSON.stringify(deploymentData, null, 2));
  console.log(`[OK] Backend deployment manifest written to: ${backendOutPath}`);

  // Also write to frontend folder for seamless consumption
  const frontendOutPath = path.join(__dirname, "..", "..", "frontend", "src", "utils", "modular-deployments.json");
  fs.writeFileSync(frontendOutPath, JSON.stringify(deploymentData, null, 2));
  console.log(`[OK] Frontend deployment manifest written to: ${frontendOutPath}`);

  console.log("\n===============================================================");
  console.log(" MODULAR CONTRACTS DEPLOYMENT COMPLETE!");
  console.log("===============================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
