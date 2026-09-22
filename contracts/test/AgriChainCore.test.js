import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;


describe("AgriChainCore", function () {
  let contract;
  let owner;
  let addr1;
  const batchId = "0x" + "1".repeat(64);
  const cropName = "tomato";
  const originFarm = "Farm A";
  const harvestDate = 1715000000;

  beforeEach(async function () {
    const AgriChainCore = await ethers.getContractFactory("AgriChainCore");
    [owner, addr1] = await ethers.getSigners();
    contract = await AgriChainCore.deploy();
    await contract.waitForDeployment();
  });

  it("registers a batch", async function () {
    await contract.registerBatch(batchId, cropName, originFarm, harvestDate, owner.address);
    const batch = await contract.batches(batchId);
    expect(batch.cropName).to.equal(cropName);
    expect(batch.currentHolder).to.equal(owner.address);
  });

  it("transfers custody forward", async function () {
    await contract.registerBatch(batchId, cropName, originFarm, harvestDate, owner.address);
    await contract.transferCustody(batchId, addr1.address, 1, 1000); // IN_TRANSIT
    const batch = await contract.batches(batchId);
    expect(batch.currentHolder).to.equal(addr1.address);
    expect(batch.state).to.equal(1);
  });

  it("reverts backward custody transfer", async function () {
    await contract.registerBatch(batchId, cropName, originFarm, harvestDate, owner.address);
    // Attempt back to REGISTERED after moving to IN_TRANSIT
    await contract.transferCustody(batchId, addr1.address, 1, 1000); // IN_TRANSIT
    await expect(contract.transferCustody(batchId, addr1.address, 0, 1000)).to.be.reverted;
  });

  it("onlyOwner can write", async function () {
    await expect(contract.connect(addr1).registerBatch(batchId, cropName, originFarm, harvestDate, addr1.address)).to.be.reverted;
  });
});
