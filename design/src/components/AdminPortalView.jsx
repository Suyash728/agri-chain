import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  PauseCircle, 
  PlayCircle, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  UserCheck, 
  UserX, 
  Lock, 
  Unlock,
  Cpu,
  Layers,
  FileCheck2
} from 'lucide-react';

export const AdminPortalView = () => {
  const [participants, setParticipants] = useState([]);
  const [contractStatus, setContractStatus] = useState({});
  const [quarantineReport, setQuarantineReport] = useState(null);
  const [quarantineLogs, setQuarantineLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Grant role form state
  const [targetAddress, setTargetAddress] = useState('');
  const [targetRole, setTargetRole] = useState('FARMER_ROLE');
  const [granting, setGranting] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch participants
      const usersRes = await fetch('http://localhost:8000/admin/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (data.participants) setParticipants(data.participants);
      }

      // 2. Fetch contract pause status
      const statusRes = await fetch('http://localhost:8000/admin/contracts/status');
      if (statusRes.ok) {
        const data = await statusRes.json();
        setContractStatus(data);
      }

      // 3. Fetch quarantine verify-integrity
      const verifyRes = await fetch('http://localhost:8000/quarantine/verify-integrity');
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        setQuarantineReport(data);
      }

      // 4. Fetch latest quarantine incidents
      const qRes = await fetch('http://localhost:8000/telemetry/quarantine');
      if (qRes.ok) {
        const data = await qRes.json();
        setQuarantineLogs(data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleGrantRole = async (e) => {
    e.preventDefault();
    if (!targetAddress.trim()) return;
    setGranting(true);
    setActionStatus(null);

    try {
      const res = await fetch('http://localhost:8000/admin/roles/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: targetAddress.trim(),
          role: targetRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to grant role on-chain');
      }

      setActionStatus({
        type: 'success',
        msg: `Role ${targetRole} successfully granted on-chain!`,
      });
      setTargetAddress('');
      fetchAllData();
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeRole = async (address, role) => {
    if (!confirm(`Revoke ${role} from ${address}?`)) return;
    setActionStatus(null);

    try {
      const res = await fetch('http://localhost:8000/admin/roles/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, role }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to revoke role on-chain');
      }

      setActionStatus({
        type: 'success',
        msg: `Role ${role} revoked from ${address.slice(0, 10)}... on-chain.`,
      });
      fetchAllData();
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    }
  };

  const handleToggleContractPause = async (contractName, currentlyPaused) => {
    const action = currentlyPaused ? 'unpause' : 'pause';
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} ${contractName}?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/admin/contracts/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: contractName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to ${action} contract`);
      }

      setActionStatus({
        type: 'success',
        msg: `Circuit-breaker ${action.toUpperCase()} executed successfully on ${contractName}.`,
      });
      fetchAllData();
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 pt-14 md:pt-16">
      {/* Header Banner */}
      <div className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B21B6]/10 text-[#5B21B6] border border-[#5B21B6]/20 text-xs font-black mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              DEFAULT_ADMIN_ROLE Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
              Master Admin & Security Console
            </h1>
            <p className="text-sm font-medium text-[#666057] mt-1 max-w-2xl">
              Manage smart contract role delegations, emergency circuit breakers, and verify cryptographic SHA-256 hash-chain logs.
            </p>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 bg-white hover:bg-[#FAF7F0] text-[#2D2620] border border-[#E6E1D5] px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh On-Chain State
          </button>
        </div>
      </div>

      {/* Action Status Alert */}
      {actionStatus && (
        <div className={`p-4 rounded-2xl mb-6 border flex items-center gap-3 text-xs font-bold ${
          actionStatus.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {actionStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{actionStatus.msg}</span>
        </div>
      )}

      {/* Section 1: Smart Contract Circuit Breakers */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-[#5B21B6]" />
          <h2 className="text-lg font-black text-[#2D2620]">Smart Contract Circuit Breakers (Pausable)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['ProductRegistry', 'CustodyTransfer', 'ColdChainMonitor'].map((name) => {
            const isPaused = Boolean(contractStatus[name]);
            return (
              <div key={name} className="bg-white rounded-2xl border border-[#E6E1D5] p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#2D2620]">{name}.sol</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                      isPaused ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isPaused ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {isPaused ? 'PAUSED' : 'OPERATIONAL'}
                    </span>
                  </div>
                  <p className="text-xs text-[#666057] mb-4">
                    {name === 'ProductRegistry' && 'Batch identity, harvest date & IPFS certificate anchors.'}
                    {name === 'CustodyTransfer' && 'Custody handoffs, price trail & forward state transitions.'}
                    {name === 'ColdChainMonitor' && 'IoT condition recordings, batched conditions & breach flags.'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleContractPause(name, isPaused)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                    isPaused 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                  {isPaused ? 'Unpause Operations' : 'Emergency Pause'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Quarantine Hash-Chain Audit Verifier */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-[#5B21B6]" />
          <h2 className="text-lg font-black text-[#2D2620]">Tamper-Evident Quarantine Hash Chain (IsoLog)</h2>
        </div>
        <div className="bg-white rounded-2xl border border-[#E6E1D5] p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6E1D5] mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-black text-[#2D2620]">Cryptographic Audit Log Integrity</span>
              </div>
              <p className="text-xs text-[#666057]">
                Continuous SHA-256 hash linking prevents tampering or deletion of off-chain anomalous telemetry.
              </p>
            </div>
            {quarantineReport && (
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-black inline-flex items-center gap-2 ${
                quarantineReport.tampered 
                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {quarantineReport.tampered ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{quarantineReport.tampered ? 'TAMPERING DETECTED' : 'UNBROKEN HASH CHAIN (VALID)'}</span>
                <span className="opacity-75">({quarantineReport.verified_records || 0} verified records)</span>
              </div>
            )}
          </div>

          {/* Quarantine Incident List Preview */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#666057] uppercase tracking-wider block">Latest Chained Incident Records</span>
            {quarantineLogs.map((item) => (
              <div key={item.id} className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-[#2D2620] flex items-center gap-2">
                    <span className="text-rose-600 font-black">[{item.id}]</span>
                    <span>Batch #{item.batchId} ({item.cropName})</span>
                    <span className="text-[#666057] font-normal">• {item.quarantinedAt}</span>
                  </div>
                  <p className="text-[11px] text-[#666057] mt-0.5">{item.details}</p>
                </div>
                {item.entryHash && (
                  <div className="text-right">
                    <span className="text-[10px] text-[#666057] font-mono block">hash: {item.entryHash.slice(0, 16)}...</span>
                    <span className="text-[9px] text-[#8C827A] font-mono block">prev: {item.prevHash ? item.prevHash.slice(0, 12) : '0000'}...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Participant Role Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Role List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6E1D5] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-[#5B21B6]" />
            <h2 className="text-lg font-black text-[#2D2620]">Authorized System Participants</h2>
          </div>
          <div className="divide-y divide-[#E6E1D5]">
            {participants.map((p, idx) => (
              <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#2D2620]">{p.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#E6E1D5] text-[10px] font-mono font-bold text-[#666057]">
                      {p.role}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#8C827A] block mt-0.5">{p.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                    p.is_granted_onchain ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {p.is_granted_onchain ? 'ON-CHAIN' : 'OFF-CHAIN'}
                  </span>
                  {p.role !== 'DEFAULT_ADMIN_ROLE' && p.role !== 'CONSUMER' && p.is_granted_onchain && (
                    <button
                      onClick={() => handleRevokeRole(p.address, p.role)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 cursor-pointer transition-all"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Grant Role Form */}
        <div className="bg-white rounded-2xl border border-[#E6E1D5] p-6 shadow-xs h-fit">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-[#5B21B6]" />
            <h2 className="text-lg font-black text-[#2D2620]">Grant On-Chain Role</h2>
          </div>
          <form onSubmit={handleGrantRole} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#666057] block mb-1">Target Ethereum Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#5B21B6]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#666057] block mb-1">Assign Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#5B21B6]"
              >
                <option value="FARMER_ROLE">FARMER_ROLE (ProductRegistry)</option>
                <option value="LOGISTICS_ROLE">LOGISTICS_ROLE (CustodyTransfer)</option>
                <option value="RETAILER_ROLE">RETAILER_ROLE (CustodyTransfer)</option>
                <option value="ORACLE_ROLE">ORACLE_ROLE (ColdChainMonitor)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={granting}
              className="w-full bg-[#5B21B6] hover:bg-[#4C1D95] text-white py-2.5 rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {granting ? 'Executing on Hardhat...' : 'Execute On-Chain Grant'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
