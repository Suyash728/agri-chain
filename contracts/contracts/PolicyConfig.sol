// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlRoles.sol";

contract PolicyConfig is AccessControlRoles {
    struct Policy {
        int256 minTempDeciC;
        int256 maxTempDeciC;
        uint256 minHumPct;
        uint256 maxHumPct;
        bool exists;
    }

    mapping(string => Policy) public policies;

    event PolicyUpdated(string indexed crop, int256 minTempDeciC, int256 maxTempDeciC, uint256 minHumPct, uint256 maxHumPct);

    function setPolicy(
        string calldata crop,
        int256 minTempDeciC,
        int256 maxTempDeciC,
        uint256 minHumPct,
        uint256 maxHumPct
    ) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "PolicyConfig: caller is not admin"
        );
        policies[crop] = Policy(minTempDeciC, maxTempDeciC, minHumPct, maxHumPct, true);
        emit PolicyUpdated(crop, minTempDeciC, maxTempDeciC, minHumPct, maxHumPct);
    }

    function getPolicy(string calldata crop) external view returns (
        int256 minTempDeciC,
        int256 maxTempDeciC,
        uint256 minHumPct,
        uint256 maxHumPct,
        bool exists
    ) {
        Policy storage p = policies[crop];
        return (p.minTempDeciC, p.maxTempDeciC, p.minHumPct, p.maxHumPct, p.exists);
    }
}
