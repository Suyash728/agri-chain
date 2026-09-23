const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ColdChainMonitor (Batched Oracle Writes & Role Enforcement)", function () {
  let monitor;
  let admin, oracle, unauthorized;
  const batchId1 = "0x" + "1".repeat(64);
  const batchId2 = "0x" + "2".repeat(64);

  beforeEach(async function () {
    [admin, oracle, unauthorized] = await ethers.getSigners();
    const ColdChainMonitor = await ethers.getContractFactory("ColdChainMonitor");
    monitor = await ColdChainMonitor.deploy();
    await monitor.waitForDeployment();

    // Grant ORACLE_ROLE
    const ORACLE_ROLE = await monitor.ORACLE_ROLE();
    await monitor.grantRole(ORACLE_ROLE, oracle.address);
  });

  it("oracle can record a single condition", async function () {
    const tempDeciC = 45; // 4.5°C
    const humidityPct = 90;
    const breach = false;

    await expect(
      monitor.connect(oracle).recordCondition(batchId1, tempDeciC, humidityPct, breach)
    )
      .to.emit(monitor, "ConditionRecorded")
      .withArgs(batchId1, tempDeciC, humidityPct, breach);

    const count = await monitor.getConditionCount(batchId1);
    expect(count).to.equal(1);

    const rec = await monitor.getConditionRecord(batchId1, 0);
    expect(rec.tempDeciC).to.equal(tempDeciC);
    expect(rec.humidityPct).to.equal(humidityPct);
    expect(rec.breach).to.equal(breach);
  });

  it("reverts when unauthorized caller tries to record condition", async function () {
    await expect(
      monitor.connect(unauthorized).recordCondition(batchId1, 45, 90, false)
    ).to.be.revertedWith("ColdChainMonitor: caller is not oracle or admin");
  });

  it("oracle can record conditions in batch", async function () {
    const batchIds = [batchId1, batchId1, batchId2];
    const temps = [42, 50, 61];
    const hums = [88, 90, 89];
    const breaches = [false, false, false];

    await expect(
      monitor.connect(oracle).recordConditionsBatch(batchIds, temps, hums, breaches)
    )
      .to.emit(monitor, "ConditionsBatchRecorded")
      .withArgs(3);

    const count1 = await monitor.getConditionCount(batchId1);
    expect(count1).to.equal(2);

    const count2 = await monitor.getConditionCount(batchId2);
    expect(count2).to.equal(1);

    const records1 = await monitor.getConditionRecords(batchId1);
    expect(records1.length).to.equal(2);
    expect(records1[0].tempDeciC).to.equal(42);
    expect(records1[1].tempDeciC).to.equal(50);
  });

  it("reverts on batched condition length mismatch", async function () {
    const batchIds = [batchId1, batchId2];
    const temps = [42]; // Mismatched length
    const hums = [88, 90];
    const breaches = [false, false];

    await expect(
      monitor.connect(oracle).recordConditionsBatch(batchIds, temps, hums, breaches)
    ).to.be.revertedWith("ColdChainMonitor: length mismatch");
  });
});
