import { ethers } from 'ethers';

export const CONTRACT_ADDRESSES = {
  ProductRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  CustodyTransfer: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  ColdChainMonitor: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  PolicyConfig: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
};

export const ROLES = {
  ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000',
  FARMER: ethers.keccak256(ethers.toUtf8Bytes('FARMER_ROLE')),
  LOGISTICS: ethers.keccak256(ethers.toUtf8Bytes('LOGISTICS_ROLE')),
  RETAILER: ethers.keccak256(ethers.toUtf8Bytes('RETAILER_ROLE')),
  ORACLE: ethers.keccak256(ethers.toUtf8Bytes('ORACLE_ROLE')),
};

export const PRODUCT_REGISTRY_ABI = [
  'function registerBatch(bytes32 batchId, string cropName, string originFarm, uint256 harvestDate, address farmer) external returns (bool)',
  'function setBatchDocument(bytes32 batchId, string docType, string ipfsCid) external returns (bool)',
  'function getBatch(bytes32 batchId) external view returns (string cropName, string originFarm, uint256 harvestDate, address farmer, bool exists)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function grantRole(bytes32 role, address account) external',
];

export const CUSTODY_TRANSFER_ABI = [
  'function initializeCustody(bytes32 batchId, address initialHolder) external',
  'function transferCustody(bytes32 batchId, address to, uint8 newState, uint256 pricePaise) external',
  'function getCustody(bytes32 batchId) external view returns (address currentHolder, uint8 state, uint256 cumulativePricePaise, bool exists)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function grantRole(bytes32 role, address account) external',
];

export const toBytes32 = (str) => {
  if (!str) return '0x' + '0'.repeat(64);
  if (str.startsWith('0x') && str.length === 66) return str;
  if (str.length <= 31) {
    return ethers.encodeBytes32String(str);
  }
  return ethers.keccak256(ethers.toUtf8Bytes(str));
};
