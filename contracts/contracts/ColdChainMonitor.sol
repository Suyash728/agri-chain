// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlRoles.sol";

contract ColdChainMonitor is AccessControlRoles {
    struct ConditionRecord {
        int64 tempDeciC;
        uint32 humidityPct;
        bool breach;
        uint48 timestamp;
    }

    mapping(bytes32 => ConditionRecord[]) internal _conditionLogs;

    event ConditionRecorded(bytes32 indexed batchId, int256 tempDeciC, uint256 humidityPct, bool breach);
    event ConditionsBatchRecorded(uint256 totalReadings);

    modifier onlyOracle() {
        require(
            hasRole(ORACLE_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "ColdChainMonitor: caller is not oracle or admin"
        );
        _;
    }

    function recordCondition(
        bytes32 batchId,
        int256 tempDeciC,
        uint256 humidityPct,
        bool breach
    ) external onlyOracle {
        _conditionLogs[batchId].push(ConditionRecord(int64(tempDeciC), uint32(humidityPct), breach, uint48(block.timestamp)));
        emit ConditionRecorded(batchId, tempDeciC, humidityPct, breach);
    }

    function recordConditionsBatch(
        bytes32[] calldata batchIds,
        int256[] calldata tempsDeciC,
        uint256[] calldata humsPct,
        bool[] calldata breaches
    ) external onlyOracle {
        uint256 len = batchIds.length;
        require(len == tempsDeciC.length && len == humsPct.length && len == breaches.length, "ColdChainMonitor: length mismatch");

        for (uint256 i = 0; i < len; i++) {
            _conditionLogs[batchIds[i]].push(
                ConditionRecord(int64(tempsDeciC[i]), uint32(humsPct[i]), breaches[i], uint48(block.timestamp))
            );
        }

        emit ConditionsBatchRecorded(len);
    }

    function getConditionCount(bytes32 batchId) external view returns (uint256) {
        return _conditionLogs[batchId].length;
    }

    function getConditionRecord(bytes32 batchId, uint256 index) external view returns (
        int256 tempDeciC,
        uint256 humidityPct,
        bool breach,
        uint256 timestamp
    ) {
        require(index < _conditionLogs[batchId].length, "ColdChainMonitor: index out of bounds");
        ConditionRecord storage r = _conditionLogs[batchId][index];
        return (r.tempDeciC, r.humidityPct, r.breach, r.timestamp);
    }

    function getConditionRecords(bytes32 batchId) external view returns (ConditionRecord[] memory) {
        return _conditionLogs[batchId];
    }
}
