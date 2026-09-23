const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductRegistry (RBAC)", function () {
  let registry;
  let admin, farmer, unauthorized;
  const batchId = "0x" + "a".repeat(64);
  const cropName = "tomato";
  const originFarm = "Sahyadri Farms Nashik";
  const harvestDate = 1715000000;

  beforeEach(async function () {
    [admin, farmer, unauthorized] = await ethers.getSigners();
    const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
    registry = await ProductRegistry.deploy();
    await registry.waitForDeployment();

    // Grant FARMER_ROLE to farmer account
    const FARMER_ROLE = await registry.FARMER_ROLE();
    await registry.grantRole(FARMER_ROLE, farmer.address);
  });

  it("admin can register a batch", async function () {
    await expect(
      registry.connect(admin).registerBatch(batchId, cropName, originFarm, harvestDate, farmer.address)
    ).to.emit(registry, "BatchRegistered").withArgs(batchId, cropName, farmer.address);

    const b = await registry.getBatch(batchId);
    expect(b.cropName).to.equal(cropName);
    expect(b.farmer).to.equal(farmer.address);
    expect(b.exists).to.be.true;
  });

  it("account with FARMER_ROLE can register a batch", async function () {
    const farmerBatchId = "0x" + "b".repeat(64);
    await expect(
      registry.connect(farmer).registerBatch(farmerBatchId, "wheat", "Punjab Cluster 2", harvestDate, farmer.address)
    ).to.emit(registry, "BatchRegistered").withArgs(farmerBatchId, "wheat", farmer.address);

    const exists = await registry.batchExists(farmerBatchId);
    expect(exists).to.be.true;
  });

  it("reverts when unauthorized caller without FARMER_ROLE tries to register a batch", async function () {
    await expect(
      registry.connect(unauthorized).registerBatch(batchId, cropName, originFarm, harvestDate, unauthorized.address)
    ).to.be.revertedWith("ProductRegistry: caller is not authorized as farmer or admin");
  });

  it("reverts on duplicate batchId", async function () {
    await registry.connect(farmer).registerBatch(batchId, cropName, originFarm, harvestDate, farmer.address);
    await expect(
      registry.connect(farmer).registerBatch(batchId, cropName, originFarm, harvestDate, farmer.address)
    ).to.be.revertedWith("ProductRegistry: batch already exists");
  });
});
