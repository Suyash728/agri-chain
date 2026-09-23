import React, { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { Wallet, ShieldCheck, CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';

const WalletContext = createContext({
  account: null,
  role: 'Unregistered',
  signer: null,
  provider: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
  isConnecting: false,
});

export const useWallet = () => useContext(WalletContext);

import { CONTRACT_ADDRESSES, ROLES } from '../utils/contracts';

const ACCESS_CONTROL_ABI = [
  'function hasRole(bytes32 role, address account) view returns (bool)',
];

const KNOWN_ROLES = {
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': 'Admin / Farmer',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': 'Logistics Partner',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': 'Dark Store Manager',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906': 'Consumer',
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState('Unregistered');
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const detectRole = async (addr, browserProvider) => {
    const lower = addr.toLowerCase();
    if (KNOWN_ROLES[lower]) {
      return KNOWN_ROLES[lower];
    }

    try {
      // Query ProductRegistry for roles
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.ProductRegistry, ACCESS_CONTROL_ABI, browserProvider);

      const [isAdmin, isFarmer] = await Promise.allSettled([
        contract.hasRole(ROLES.ADMIN, addr),
        contract.hasRole(ROLES.FARMER, addr),
      ]);

      if (isAdmin.status === 'fulfilled' && isAdmin.value) return 'Admin / Farmer';
      if (isFarmer.status === 'fulfilled' && isFarmer.value) return 'Farmer';
    } catch (e) {
      console.log('Role detection on-chain fallback:', e);
    }

    return 'Consumer';
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask or Web3 wallet extension not detected. Please install MetaMask to sign transactions on-chain.');
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        const userAddr = accounts[0];
        const userSigner = await browserProvider.getSigner();
        const detectedRole = await detectRole(userAddr, browserProvider);

        setAccount(userAddr);
        setRole(detectedRole);
        setSigner(userSigner);
        setProvider(browserProvider);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setRole('Unregistered');
    setSigner(null);
    setProvider(null);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          browserProvider.getSigner().then((s) => {
            setAccount(accounts[0]);
            setSigner(s);
            setProvider(browserProvider);
            detectRole(accounts[0], browserProvider).then(setRole);
          });
        } else {
          disconnectWallet();
        }
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        role,
        signer,
        provider,
        connectWallet,
        disconnectWallet,
        isConnecting,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const WalletConnect = () => {
  const { account, role, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-3 py-1.5 rounded-xl bg-[#354424] text-white text-xs font-black shadow-xs hover:bg-[#2A371C] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <Wallet className="w-3.5 h-3.5" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    );
  }

  const roleColors = {
    'Admin / Farmer': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Farmer': 'bg-green-100 text-green-800 border-green-300',
    'Logistics Partner': 'bg-blue-100 text-blue-800 border-blue-300',
    'Dark Store Manager': 'bg-purple-100 text-purple-800 border-purple-300',
    'Consumer': 'bg-amber-100 text-amber-800 border-amber-300',
    'Unregistered': 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const badgeColor = roleColors[role] || 'bg-emerald-100 text-emerald-800 border-emerald-300';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E6E1D5] shadow-xs text-xs flex items-center gap-2 hover:bg-[#FAF7F0] transition-colors cursor-pointer"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono font-bold text-[#2D2620]">
          {shortenAddress(account)}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeColor}`}>
          {role}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#666057]" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E6E1D5] p-3 z-50 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#F4F5E6]">
            <span className="text-[11px] font-bold text-[#666057]">Web3 Wallet Status</span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Connected
            </span>
          </div>

          <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E6E1D5] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#666057]">Active Ethereum Address</span>
            <span className="font-mono text-xs font-black text-[#2D2620] break-all">
              {account}
            </span>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#666057]">Supply Chain Role:</span>
            <span className="text-xs font-extrabold text-[#354424]">{role}</span>
          </div>

          <button
            onClick={() => {
              disconnectWallet();
              setShowDropdown(false);
            }}
            className="w-full mt-1 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs font-extrabold text-[#A8422B] hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};
