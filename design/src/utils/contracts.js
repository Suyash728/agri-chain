import { ethers } from 'ethers';

export const CONTRACT_ADDRESSES = {
  ProductRegistry: '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF',
  CustodyTransfer: '0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf',
  ColdChainMonitor: '0x9d4454B023096f34B160D6B654540c56A1F81688',
  PolicyConfig: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
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
