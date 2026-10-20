// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlRoles.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CustodyTransfer is AccessControlRoles, Pausable {
    enum CustodyState { REGISTERED, IN_TRANSIT, IN_STORAGE, AT_RETAIL, SOLD }

    struct CustodyRecord {
        address currentHolder;
        CustodyState state;
        uint256 cumulativePricePaise;
        bool exists;
    }

    mapping(bytes32 => CustodyRecord) public custody;

    event CustodyTransferred(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        CustodyState newState,
        uint256 pricePaise
    );

    function initializeCustody(bytes32 batchId, address initialHolder) external whenNotPaused {
        require(
            hasRole(FARMER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CustodyTransfer: caller is not authorized as farmer or admin"
        );
        require(!custody[batchId].exists, "CustodyTransfer: batch custody already initialized");
        custody[batchId] = CustodyRecord(initialHolder, CustodyState.REGISTERED, 0, true);
    }

    function transferCustody(
        bytes32 batchId,
        address to,
        CustodyState newState,
        uint256 pricePaise
    ) external whenNotPaused {
        CustodyRecord storage c = custody[batchId];
        require(c.exists, "CustodyTransfer: unknown batch");
        require(uint8(newState) > uint8(c.state), "CustodyTransfer: no backward or identical transitions");

        if (newState == CustodyState.IN_TRANSIT) {
            require(
                hasRole(LOGISTICS_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "CustodyTransfer: requires LOGISTICS_ROLE"
            );
        } else if (
            newState == CustodyState.IN_STORAGE ||
            newState == CustodyState.AT_RETAIL ||
            newState == CustodyState.SOLD
        ) {
            require(
                hasRole(RETAILER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "CustodyTransfer: requires RETAILER_ROLE"
            );
        }

        address from = c.currentHolder;
        c.currentHolder = to;
        c.state = newState;
        c.cumulativePricePaise = pricePaise;

        emit CustodyTransferred(batchId, from, to, newState, pricePaise);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function getCustody(bytes32 batchId) external view returns (
        address currentHolder,
        CustodyState state,
        uint256 cumulativePricePaise,
        bool exists
    ) {
        CustodyRecord storage c = custody[batchId];
        return (c.currentHolder, c.state, c.cumulativePricePaise, c.exists);
    }
}
