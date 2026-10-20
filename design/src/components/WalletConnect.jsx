import React, { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { Wallet, ShieldCheck, CheckCircle2, ChevronDown, ExternalLink, IndianRupee } from 'lucide-react';

const WalletContext = createContext({
  account: null,
  role: 'Unregistered',
  signer: null,
  provider: null,
  identity: null,
  isGasless: true,
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

export const ROLE_IDENTITIES = {
  farmer: {
    name: 'Rahul Patil',
    roleTitle: 'Farmer',
    id: 'KISAN-MH-412',
    org: 'Nashik Organic Cluster #4',
    upi: 'rahul.patil@okhdfcbank',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  logistics: {
    name: 'Safexpress Logistics',
    roleTitle: 'Logistics',
    id: 'TRANS-DL-804',
    org: 'Safexpress Cold Fleet North-West',
    upi: 'safexpress.fleet@icici',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  darkstore: {
    name: 'Pune Fresh Hub',
    roleTitle: 'Dark Store',
    id: 'STORE-PUN-09',
    org: 'Blinkit / Dark Store Network Bin A-04',
    upi: 'punefresh.billing@yesbank',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  consumer: {
    name: 'Priya Sharma',
    roleTitle: 'Consumer',
    id: 'CITIZEN-IN-109',
    org: 'Verified Retail Customer',
    upi: 'priya.sharma@okaxis',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  admin: {
    name: 'AgriChain Admin',
    roleTitle: 'Admin',
    id: 'ADMIN-SYS-001',
    org: 'AgriChain Governance Multisig',
    upi: 'admin.governance@eth',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
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
      return { success: false, reason: 'NOT_INSTALLED' };
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
        return { success: true, account: userAddr };
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      return { success: false, reason: 'REJECTED' };
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
        isGasless: !account,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const WalletConnect = ({ activeRole = 'farmer' }) => {
  const { account, role, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [metaMaskNotice, setMetaMaskNotice] = useState('');

  const currentIdentity = ROLE_IDENTITIES[activeRole] || ROLE_IDENTITIES.farmer;

  const handleMetaMaskConnect = async () => {
    const res = await connectWallet();
    if (!res || !res.success) {
      if (res?.reason === 'NOT_INSTALLED') {
        setMetaMaskNotice('MetaMask extension not found. You are operating in Native Rupee Mode with automated relayer sponsorship.');
      } else {
        setMetaMaskNotice('Connection request dismissed. Continuing in Native Rupee Mode.');
      }
      setTimeout(() => setMetaMaskNotice(''), 5000);
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // 1. Auditor / MetaMask connected view
  if (account) {
    return (
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-[210px] sm:w-[220px] h-[34px] px-2.5 rounded-xl bg-white border border-[#E6E1D5] shadow-xs text-xs flex items-center justify-between gap-1.5 hover:bg-[#FAF7F0] transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="font-mono font-bold text-[#2D2620] truncate text-xs">
              {shortenAddress(account)}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-50 text-emerald-800 border-emerald-300 flex-shrink-0">
            Auditor
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#666057] flex-shrink-0" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E6E1D5] p-3.5 z-50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4F5E6]">
              <span className="text-[11px] font-bold text-[#666057]">Web3 Auditor Status</span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Connected
              </span>
            </div>

            <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E6E1D5] flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#666057]">Active Signing Address</span>
              <span className="font-mono text-xs font-black text-[#2D2620] break-all">
                {account}
              </span>
            </div>

            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-[#666057]">Detected Role:</span>
              <span className="font-extrabold text-[#354424]">{role}</span>
            </div>

            <div className="text-[10px] text-[#786E65] bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/60">
              💡 <b>Academic / Auditor Mode Active:</b> Transactions will be signed directly via your connected Web3 wallet.
            </div>

            <button
              onClick={() => {
                disconnectWallet();
                setShowDropdown(false);
              }}
              className="w-full mt-1 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs font-extrabold text-[#A8422B] hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Disconnect (Return to Rupee Mode)
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Default: Native Indian Rupee / Kisan Digital ID
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-[210px] sm:w-[220px] h-[34px] px-2.5 rounded-xl bg-white border border-[#E6E1D5] shadow-xs text-xs flex items-center justify-between gap-1.5 hover:bg-[#FAF7F0] transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
        title="Verified Indian Rupee Digital Identity"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="text-emerald-700 font-black flex-shrink-0">₹</span>
          <span className="font-extrabold text-[#2D2620] truncate text-xs text-left">
            {currentIdentity.name}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex-shrink-0 ml-1.5 ${currentIdentity.badge}`}>
          {currentIdentity.roleTitle}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#666057] flex-shrink-0 ml-1" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E6E1D5] p-3.5 z-50 flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#F4F5E6]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-black text-[#2D2620]">Kisan Digital Identity</span>
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified • Gasless
            </span>
          </div>

          <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E6E1D5] flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[10px] text-[#666057] font-bold">
              <span>Account Holder</span>
              <span className="font-mono text-[#3D4E2A] font-extrabold">{currentIdentity.id}</span>
            </div>
            <span className="text-xs font-black text-[#2D2620]">{currentIdentity.name}</span>
            <span className="text-[11px] text-[#786E65]">{currentIdentity.org}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-[#E6E1D5] flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#666057]">Linked UPI ID:</span>
              <span className="font-mono text-[11px] font-bold text-[#2D2620]">{currentIdentity.upi}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#666057]">Settlement Currency:</span>
              <span className="text-[11px] font-black text-emerald-700">Indian Rupee (INR ₹)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#666057]">Network Gas Fee:</span>
              <span className="text-[11px] font-black text-[#3D4E2A]">₹0.00 (FPO/Relayer Sponsored)</span>
            </div>
          </div>

          <div className="text-[10px] text-[#786E65] bg-[#FAF7F0] p-2.5 rounded-xl leading-relaxed border border-[#E6E1D5]/60">
            🌾 <b>Zero Crypto Required:</b> You are trading in Indian Rupees. All blockchain custody updates and condition batches are anchored automatically in the background at zero cost to you.
          </div>

          {/* Web3 Auditor Option */}
          <div className="pt-1.5 border-t border-[#F4F5E6] flex flex-col gap-1.5">
            <button
              onClick={handleMetaMaskConnect}
              disabled={isConnecting}
              className="w-full py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs font-bold text-[#666057] hover:bg-emerald-50 hover:text-[#3D4E2A] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3D4E2A]" />
              <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask (Auditor Mode)'}</span>
            </button>
            {metaMaskNotice && (
              <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 leading-snug">
                {metaMaskNotice}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

