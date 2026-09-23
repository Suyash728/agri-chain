const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustodyTransfer (Forward State & Role Enforcement)", function () {
  let custodyContract;
  let admin, farmer, logistics, retailer, unauthorized;
  const batchId = "0x" + "c".repeat(64);

  beforeEach(async function () {
    [admin, farmer, logistics, retailer, unauthorized] = await ethers.getSigners();
    const CustodyTransfer = await ethers.getContractFactory("CustodyTransfer");
    custodyContract = await CustodyTransfer.deploy();
    await custodyContract.waitForDeployment();

    // Grant roles
    const FARMER_ROLE = await custodyContract.FARMER_ROLE();
    const LOGISTICS_ROLE = await custodyContract.LOGISTICS_ROLE();
    const RETAILER_ROLE = await custodyContract.RETAILER_ROLE();

    await custodyContract.grantRole(FARMER_ROLE, farmer.address);
    await custodyContract.grantRole(LOGISTICS_ROLE, logistics.address);
    await custodyContract.grantRole(RETAILER_ROLE, retailer.address);

    // Initialize custody by farmer
    await custodyContract.connect(farmer).initializeCustody(batchId, farmer.address);
  });

  it("farmer initializes custody in REGISTERED state", async function () {
    const c = await custodyContract.getCustody(batchId);
    expect(c.currentHolder).to.equal(farmer.address);
    expect(c.state).to.equal(0); // REGISTERED
    expect(c.exists).to.be.true;
  });

  it("logistics role transfers custody to IN_TRANSIT with stage price", async function () {
    const transitPrice = 120000; // Rs. 1,200 in paise
    await expect(
      custodyContract.connect(logistics).transferCustody(batchId, logistics.address, 1, transitPrice)
    )
      .to.emit(custodyContract, "CustodyTransferred")
      .withArgs(batchId, farmer.address, logistics.address, 1, transitPrice);

    const c = await custodyContract.getCustody(batchId);
    expect(c.currentHolder).to.equal(logistics.address);
    expect(c.state).to.equal(1); // IN_TRANSIT
    expect(c.cumulativePricePaise).to.equal(transitPrice);
  });

  it("reverts when unauthorized caller tries to transfer to IN_TRANSIT", async function () {
    await expect(
      custodyContract.connect(unauthorized).transferCustody(batchId, unauthorized.address, 1, 1000)
    ).to.be.revertedWith("CustodyTransfer: requires LOGISTICS_ROLE");
  });

  it("reverts on backward or identical state transition", async function () {
    // Move to IN_TRANSIT (1)
    await custodyContract.connect(logistics).transferCustody(batchId, logistics.address, 1, 1000);

    // Attempt back to REGISTERED (0) -> revert
    await expect(
      custodyContract.connect(logistics).transferCustody(batchId, farmer.address, 0, 1000)
    ).to.be.revertedWith("CustodyTransfer: no backward or identical transitions");

    // Attempt same state IN_TRANSIT (1) -> revert
    await expect(
      custodyContract.connect(logistics).transferCustody(batchId, logistics.address, 1, 1200)
    ).to.be.revertedWith("CustodyTransfer: no backward or identical transitions");
  });

  it("retailer role transfers custody to IN_STORAGE and SOLD", async function () {
    // 1. Move to IN_TRANSIT (1)
    await custodyContract.connect(logistics).transferCustody(batchId, logistics.address, 1, 1000);

    // 2. Move to IN_STORAGE (2) by Retailer
    await custodyContract.connect(retailer).transferCustody(batchId, retailer.address, 2, 1500);
    let c = await custodyContract.getCustody(batchId);
    expect(c.state).to.equal(2);

    // 3. Move to SOLD (4) by Retailer
    await custodyContract.connect(retailer).transferCustody(batchId, unauthorized.address, 4, 2000);
    c = await custodyContract.getCustody(batchId);
    expect(c.state).to.equal(4);
    expect(c.cumulativePricePaise).to.equal(2000);
  });
});
