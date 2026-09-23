// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlRoles.sol";

contract ProductRegistry is AccessControlRoles {
    struct Batch {
        string cropName;
        string originFarm;
        uint256 harvestDate;
        address farmer;
        bool exists;
    }

    mapping(bytes32 => Batch) public batches;

    event BatchRegistered(bytes32 indexed batchId, string cropName, address indexed farmer);
    event BatchDocumentAnchored(bytes32 indexed batchId, string docType, string ipfsCid);

    modifier onlyFarmerOrAdmin() {
        require(
            hasRole(FARMER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "ProductRegistry: caller is not authorized as farmer or admin"
        );
        _;
    }

    function registerBatch(
        bytes32 batchId,
        string calldata cropName,
        string calldata originFarm,
        uint256 harvestDate,
        address farmer
    ) external onlyFarmerOrAdmin {
        require(!batches[batchId].exists, "ProductRegistry: batch already exists");
        batches[batchId] = Batch(cropName, originFarm, harvestDate, farmer, true);
        emit BatchRegistered(batchId, cropName, farmer);
    }

    function getBatch(bytes32 batchId) external view returns (
        string memory cropName,
        string memory originFarm,
        uint256 harvestDate,
        address farmer,
        bool exists
    ) {
        Batch storage b = batches[batchId];
        return (b.cropName, b.originFarm, b.harvestDate, b.farmer, b.exists);
    }

    function batchExists(bytes32 batchId) external view returns (bool) {
        return batches[batchId].exists;
    }
}
