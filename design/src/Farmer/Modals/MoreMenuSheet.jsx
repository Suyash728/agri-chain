import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Wallet, 
  User, 
  LogOut, 
  X,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  KeyRound
} from 'lucide-react';

export const MoreMenuSheet = ({ isOpen, onClose, onSelectTab, onLogout }) => {
  const [activeSubView, setActiveSubView] = useState('menu'); // 'menu' | 'admin-roles'
  const [adminUsers, setAdminUsers] = useState([]);
  const [targetAddress, setTargetAddress] = useState('');
  const [targetRole, setTargetRole] = useState('FARMER_ROLE');
  const [granting, setGranting] = useState(false);
  const [grantStatus, setGrantStatus] = useState(null);

  useEffect(() => {
    if (activeSubView === 'admin-roles') {
      fetch('http://localhost:8000/admin/users')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.participants) setAdminUsers(data.participants);
        })
        .catch((err) => console.log('Admin users fetch error:', err));
    }
  }, [activeSubView]);

  if (!isOpen) return null;

  const handleGrantRole = async (e) => {
    e.preventDefault();
    if (!targetAddress) return;
    setGranting(true);
    setGrantStatus(null);

    try {
      const res = await fetch('http://localhost:8000/admin/roles/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: targetAddress,
          role: targetRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to grant role on-chain');
      }

      const data = await res.json();
      setGrantStatus({
        type: 'success',
        msg: `Role ${targetRole} successfully granted to ${targetAddress.substring(0, 8)}... on-chain!`,
      });

      // Refresh list
      const updated = await fetch('http://localhost:8000/admin/users').then((r) => r.json());
      if (updated && updated.participants) setAdminUsers(updated.participants);
      setTargetAddress('');
    } catch (err) {
      setGrantStatus({ type: 'error', msg: err.message });
    } finally {
      setGranting(false);
    }
  };

  const moreItems = [
    { id: 'shipments', label: 'Shipments', icon: Truck, desc: 'Active & past transport logs' },
    { id: 'earnings', label: 'Earnings', icon: Wallet, desc: 'Monthly income breakdown' },
    { id: 'profile', label: 'Profile', icon: User, desc: 'Farmer account & farm settings' },
    { id: 'admin-roles', label: 'Admin Role Governance', icon: ShieldCheck, desc: 'Authorize smart contract roles on-chain' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-[#E6E1D5] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeSubView !== 'menu' && (
              <button
                onClick={() => setActiveSubView('menu')}
                className="w-7 h-7 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028] mr-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-3 h-3 rounded-full bg-[#3D4E2A]"></div>
            <h3 className="text-base font-extrabold text-[#3B3028]">
              {activeSubView === 'admin-roles' ? 'Smart Contract Roles' : 'More Options'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items or Admin Sub-View */}
        {activeSubView === 'menu' ? (
          <div className="p-4 flex flex-col gap-2 overflow-y-auto">
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'admin-roles') {
                      setActiveSubView('admin-roles');
                    } else {
                      onSelectTab(item.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E3EBD3]/60 border border-[#E6E1D5] text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#E6E1D5] text-[#3D4E2A] group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#3B3028]">{item.label}</h4>
                    <p className="text-xs text-[#786E65] font-medium">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Grant Role Form */}
            <form onSubmit={handleGrantRole} className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E6E1D5] flex flex-col gap-2.5">
              <span className="text-xs font-black text-[#2D2620] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#354424]" />
                Grant Smart Contract Role
              </span>
              <div>
                <label className="text-[10px] font-bold text-[#666057] block mb-1">Target Ethereum Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E1D5] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#354424]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E6E1D5] text-xs font-bold focus:outline-none"
                >
                  <option value="FARMER_ROLE">FARMER_ROLE (Register produce)</option>
                  <option value="LOGISTICS_ROLE">LOGISTICS_ROLE (In-transit custody)</option>
                  <option value="RETAILER_ROLE">RETAILER_ROLE (Dark store custody)</option>
                  <option value="ORACLE_ROLE">ORACLE_ROLE (Cold chain ingest)</option>
                </select>
                <button
                  type="submit"
                  disabled={granting}
                  className="px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-black hover:bg-[#2A371C] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {granting ? 'Granting...' : 'Grant'}
                </button>
              </div>

              {grantStatus && (
                <div className={`p-2 rounded-xl text-[11px] font-bold ${
                  grantStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {grantStatus.msg}
                </div>
              )}
            </form>

            {/* Participants Status List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black text-[#2D2620]">Participant On-Chain Status</span>
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {adminUsers.map((u, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#2D2620]">{u.name}</span>
                      <span className="font-mono text-[10px] text-[#666057]">
                        {u.address ? `${u.address.substring(0, 6)}...${u.address.substring(u.address.length - 4)}` : ''} • {u.role}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      u.is_granted_onchain ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {u.is_granted_onchain ? '✓ On-Chain' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Logout */}
        <div className="p-4 bg-[#FAF7F0] border-t border-[#E6E1D5]">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-3 bg-[#FAF7F0] hover:bg-[#FBE8E8] text-[#8B3A3A] border border-[#E8C5C5] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
