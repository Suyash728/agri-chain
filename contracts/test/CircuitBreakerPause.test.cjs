const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Smart Contract Circuit Breaker (Pausable)", function () {
  let admin, farmer, logistics, retailer, oracle, attacker;
  let productRegistry, custodyTransfer, coldChainMonitor;
  const batchId = ethers.encodeBytes32String("PAUSE-BATCH-001");

  beforeEach(async function () {
    [admin, farmer, logistics, retailer, oracle, attacker] = await ethers.getSigners();

    const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
    productRegistry = await ProductRegistry.deploy();
    await productRegistry.waitForDeployment();

    const CustodyTransfer = await ethers.getContractFactory("CustodyTransfer");
    custodyTransfer = await CustodyTransfer.deploy();
    await custodyTransfer.waitForDeployment();

    const ColdChainMonitor = await ethers.getContractFactory("ColdChainMonitor");
    coldChainMonitor = await ColdChainMonitor.deploy();
    await coldChainMonitor.waitForDeployment();

    // Grant roles
    const FARMER_ROLE = await productRegistry.FARMER_ROLE();
    const LOGISTICS_ROLE = await custodyTransfer.LOGISTICS_ROLE();
    const ORACLE_ROLE = await coldChainMonitor.ORACLE_ROLE();

    await productRegistry.grantRole(FARMER_ROLE, farmer.address);
    await custodyTransfer.grantRole(FARMER_ROLE, farmer.address);
    await custodyTransfer.grantRole(LOGISTICS_ROLE, logistics.address);
    await coldChainMonitor.grantRole(ORACLE_ROLE, oracle.address);
  });

  it("admin can pause and unpause ProductRegistry, preventing batch registration when paused", async function () {
    expect(await productRegistry.paused()).to.equal(false);

    // Non-admin cannot pause
    await expect(
      productRegistry.connect(attacker).pause()
    ).to.be.revertedWithCustomError(productRegistry, "AccessControlUnauthorizedAccount");

    // Admin pauses contract
    await productRegistry.connect(admin).pause();
    expect(await productRegistry.paused()).to.equal(true);

    // Mutating call must revert while paused
    await expect(
      productRegistry.connect(farmer).registerBatch(
        batchId,
        "Organic Tomato",
        "Baramati Farm",
        Math.floor(Date.now() / 1000),
        farmer.address
      )
    ).to.be.revertedWithCustomError(productRegistry, "EnforcedPause");

    // Admin unpauses contract
    await productRegistry.connect(admin).unpause();
    expect(await productRegistry.paused()).to.equal(false);

    // Now registration succeeds
    await expect(
      productRegistry.connect(farmer).registerBatch(
        batchId,
        "Organic Tomato",
        "Baramati Farm",
        Math.floor(Date.now() / 1000),
        farmer.address
      )
    ).to.emit(productRegistry, "BatchRegistered");
  });

  it("admin can pause ColdChainMonitor, preventing condition records during an emergency", async function () {
    await coldChainMonitor.connect(admin).pause();
    expect(await coldChainMonitor.paused()).to.equal(true);

    // Oracle cannot write while paused
    await expect(
      coldChainMonitor.connect(oracle).recordCondition(batchId, 45, 85, false)
    ).to.be.revertedWithCustomError(coldChainMonitor, "EnforcedPause");

    // Unpause restores writing
    await coldChainMonitor.connect(admin).unpause();
    await expect(
      coldChainMonitor.connect(oracle).recordCondition(batchId, 45, 85, false)
    ).to.emit(coldChainMonitor, "ConditionRecorded");
  });

  it("admin can pause CustodyTransfer, locking custody during an emergency audit", async function () {
    await custodyTransfer.connect(admin).pause();

    await expect(
      custodyTransfer.connect(farmer).initializeCustody(batchId, farmer.address)
    ).to.be.revertedWithCustomError(custodyTransfer, "EnforcedPause");

    await custodyTransfer.connect(admin).unpause();
    await expect(
      custodyTransfer.connect(farmer).initializeCustody(batchId, farmer.address)
    ).to.not.be.reverted;
  });
});
