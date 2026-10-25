import { ethers } from 'ethers';
import deployments from './modular-deployments.json';

export const CONTRACT_ADDRESSES = deployments?.contracts || {
  ProductRegistry: '0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901',
  CustodyTransfer: '0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9',
  ColdChainMonitor: '0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff',
  PolicyConfig: '0x4631BCAbD6dF18D94796344963cB60d44a4136b6',
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
