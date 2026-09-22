// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriChainCore {
    address public owner;

    enum CustodyState { REGISTERED, IN_TRANSIT, IN_STORAGE, AT_RETAIL, SOLD }

    struct Batch {
        string cropName;
        string originFarm;
        uint256 harvestDate;
        address currentHolder;
        CustodyState state;
        bool exists;
    }

    mapping(bytes32 => Batch) public batches;

    event BatchRegistered(bytes32 indexed batchId, string cropName, address farmer);
    event CustodyTransferred(bytes32 indexed batchId, address from, address to, CustodyState newState, uint256 pricePaise);
    event ConditionRecorded(bytes32 indexed batchId, int256 tempDeciC, uint256 humidityPct, bool breach);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgriChain: caller is not the backend");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // All writes come from the backend's single account (see ARCHITECTURE.md S3).
    // Per-user wallet signing is Optional tier (O2 in PRD.md) — not implemented here.

    function registerBatch(bytes32 batchId, string calldata cropName, string calldata originFarm, uint256 harvestDate, address farmer) external onlyOwner {
        require(!batches[batchId].exists, "AgriChain: batch already exists");
        batches[batchId] = Batch(cropName, originFarm, harvestDate, farmer, CustodyState.REGISTERED, true);
        emit BatchRegistered(batchId, cropName, farmer);
    }

    function transferCustody(bytes32 batchId, address to, CustodyState newState, uint256 pricePaise) external onlyOwner {
        Batch storage b = batches[batchId];
        require(b.exists, "AgriChain: unknown batch");
        require(uint8(newState) > uint8(b.state), "AgriChain: no backward transitions");
        address from = b.currentHolder;
        b.currentHolder = to;
        b.state = newState;
        emit CustodyTransferred(batchId, from, to, newState, pricePaise);
    }

    function recordCondition(bytes32 batchId, int256 tempDeciC, uint256 humidityPct, bool breach) external onlyOwner {
        require(batches[batchId].exists, "AgriChain: unknown batch");
        emit ConditionRecorded(batchId, tempDeciC, humidityPct, breach);
    }
}
