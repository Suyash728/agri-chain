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

  it("anchors IPFS document CID on-chain for an existing batch", async function () {
    await registry.connect(farmer).registerBatch(batchId, cropName, originFarm, harvestDate, farmer.address);

    const cid = "ipfs://QmSaQ9tsRGYUodzrtBmRmPTBykAE4oTR9zu7Lfjh9qVmMQ";
    await expect(
      registry.connect(farmer).setBatchDocument(batchId, "QUALITY_CERTIFICATE", cid)
    ).to.emit(registry, "BatchDocumentAnchored").withArgs(batchId, "QUALITY_CERTIFICATE", cid);

    const docs = await registry.getBatchDocuments(batchId);
    expect(docs.length).to.equal(1);
    expect(docs[0].docType).to.equal("QUALITY_CERTIFICATE");
    expect(docs[0].ipfsCid).to.equal(cid);
  });

  it("reverts when setting document for unknown batch or unauthorized caller", async function () {
    const unknownBatch = "0x" + "9".repeat(64);
    const cid = "ipfs://QmSampleCID";
    await expect(
      registry.connect(farmer).setBatchDocument(unknownBatch, "LAB_REPORT", cid)
    ).to.be.revertedWith("ProductRegistry: batch does not exist");

    await registry.connect(farmer).registerBatch(batchId, cropName, originFarm, harvestDate, farmer.address);
    await expect(
      registry.connect(unauthorized).setBatchDocument(batchId, "LAB_REPORT", cid)
    ).to.be.revertedWith("ProductRegistry: caller is not authorized as farmer or admin");
  });
});
