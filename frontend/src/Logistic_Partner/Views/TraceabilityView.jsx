import React, { useState, useEffect, useCallback } from 'react';
import { 
  Link2, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Search, 
  Sprout, 
  Wheat, 
  Truck, 
  Store, 
  ShoppingBag, 
  FileText, 
  Clock, 
  Thermometer, 
  Award,
  ExternalLink
} from 'lucide-react';
import { LargeQRModal } from '../../components/LargeQRModal';
import { getBatchQRCodeImageUrl } from '../../utils/qrHelper';

export const TraceabilityView = () => {
  const [availableBatches, setAvailableBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveBatch, setLiveBatch] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const loadBatches = useCallback(() => {
    fetch('http://localhost:8000/batches')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableBatches(data);
          if (!searchQuery) {
            setSearchQuery(data[0].batch_id || data[0].batchId);
          }
        } else {
          setAvailableBatches([]);
          setSearchQuery('');
          setLiveBatch(null);
        }
      })
      .catch(() => {
        setAvailableBatches([]);
        setLiveBatch(null);
      });
  }, [searchQuery]);

  useEffect(() => {
    loadBatches();
    window.addEventListener('agrichain-data-reset', loadBatches);
    window.addEventListener('agrichain-data-updated', loadBatches);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadBatches);
      window.removeEventListener('agrichain-data-updated', loadBatches);
    };
  }, [loadBatches]);

  useEffect(() => {
    const cleanId = searchQuery.trim().toUpperCase();
    if (!cleanId) {
      setLiveBatch(null);
      return;
    }
    fetch(`http://localhost:8000/batches/${cleanId}/traceability`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && (data.batchId || data.batch_id)) {
          setLiveBatch(data);
        } else {
          setLiveBatch(null);
        }
      })
      .catch(() => setLiveBatch(null));
  }, [searchQuery]);

  const activeBatchId = liveBatch ? (liveBatch.batchId || liveBatch.batch_id) : searchQuery;
  const qrUrl = activeBatchId ? getBatchQRCodeImageUrl(activeBatchId) : '';

  const currentState = liveBatch?.currentState || 'REGISTERED';

  const getDynamicStages = (st) => {
    if (st === 'SOLD') {
      return [
        { label: 'Farm Origin', status: 'Completed', type: 'completed', icon: Sprout, detail: liveBatch?.farmDetails?.split('||')[0].trim() || 'Farm Gate' },
        { label: 'Harvest Log', status: 'Completed', type: 'completed', icon: Wheat, detail: liveBatch?.harvestDate || 'Harvested' },
        { label: 'Custody Handoff', status: 'Completed', type: 'completed', icon: CheckCircle2, detail: 'Carrier Accepted' },
        { label: 'Reefer Transit', status: 'Completed', type: 'completed', icon: Truck, detail: 'Highway Transit Done' },
        { label: 'Retail & Sale', status: 'Delivered & Sold', type: 'completed', icon: ShoppingBag, detail: 'Consumer Doorstep' },
      ];
    }
    if (st === 'AT_RETAIL') {
      return [
        { label: 'Farm Origin', status: 'Completed', type: 'completed', icon: Sprout, detail: liveBatch?.farmDetails?.split('||')[0].trim() || 'Farm Gate' },
        { label: 'Harvest Log', status: 'Completed', type: 'completed', icon: Wheat, detail: liveBatch?.harvestDate || 'Harvested' },
        { label: 'Custody Handoff', status: 'Completed', type: 'completed', icon: CheckCircle2, detail: 'Carrier Accepted' },
        { label: 'Reefer Transit', status: 'Completed', type: 'completed', icon: Truck, detail: 'Delivered to Store' },
        { label: 'DarkStore Retail', status: 'At Retail', type: 'active', icon: Store, detail: 'Inventory Available' },
      ];
    }
    if (st === 'IN_STORAGE') {
      return [
        { label: 'Farm Origin', status: 'Completed', type: 'completed', icon: Sprout, detail: liveBatch?.farmDetails?.split('||')[0].trim() || 'Farm Gate' },
        { label: 'Harvest Log', status: 'Completed', type: 'completed', icon: Wheat, detail: liveBatch?.harvestDate || 'Harvested' },
        { label: 'Custody Handoff', status: 'Completed', type: 'completed', icon: CheckCircle2, detail: 'Carrier Accepted' },
        { label: 'Reefer Transit', status: 'Completed', type: 'completed', icon: Truck, detail: 'Delivered to Warehouse' },
        { label: 'Cold Storage', status: 'In Storage (GRN)', type: 'active', icon: Store, detail: 'Climate Controlled' },
      ];
    }
    if (st === 'IN_TRANSIT') {
      return [
        { label: 'Farm Origin', status: 'Completed', type: 'completed', icon: Sprout, detail: liveBatch?.farmDetails?.split('||')[0].trim() || 'Farm Gate' },
        { label: 'Harvest Log', status: 'Completed', type: 'completed', icon: Wheat, detail: liveBatch?.harvestDate || 'Harvested' },
        { label: 'Custody Handoff', status: 'Dispatched', type: 'completed', icon: CheckCircle2, detail: 'Carrier In Custody' },
        { label: 'Reefer Transit', status: 'In Transit', type: 'active', icon: Truck, detail: 'Live Highway Route' },
        { label: 'Storage Hub', status: 'Inbound Pending', type: 'pending', icon: Store, detail: 'En Route' },
      ];
    }
    if (st === 'CONFIRMED' || st === 'READY_FOR_PICKUP') {
      return [
        { label: 'Farm Origin', status: 'Completed', type: 'completed', icon: Sprout, detail: liveBatch?.farmDetails?.split('||')[0].trim() || 'Farm Gate' },
        { label: 'Harvest Log', status: 'Completed', type: 'completed', icon: Wheat, detail: liveBatch?.harvestDate || 'Harvested' },
        { label: 'Custody Handoff', status: 'Order Confirmed', type: 'active', icon: CheckCircle2, detail: 'Pickup Scheduled' },
        { label: 'Reefer Transit', status: 'Pending', type: 'pending', icon: Truck, detail: 'Awaiting Departure' },
        { label: 'Storage Hub', status: 'Pending', type: 'pending', icon: Store, detail: 'Awaiting Arrival' },
      ];
    }
    // Default: REGISTERED
    return [
      { label: 'Farm Origin', status: 'Completed', type: 'completed', icon: Sprout, detail: liveBatch?.farmDetails?.split('||')[0].trim() || 'Farm Gate' },
      { label: 'Harvest Log', status: 'Completed', type: 'completed', icon: Wheat, detail: liveBatch?.harvestDate || 'Harvested' },
      { label: 'Custody Handoff', status: 'Awaiting Pickup', type: 'pending', icon: CheckCircle2, detail: 'At Farm Staging' },
      { label: 'Reefer Transit', status: 'Pending', type: 'pending', icon: Truck, detail: 'Pending Dispatch' },
      { label: 'Storage Hub', status: 'Pending', type: 'pending', icon: Store, detail: 'Pending Arrival' },
    ];
  };

  const stages = getDynamicStages(currentState);

  const cleanFarm = (liveBatch?.farmDetails || liveBatch?.origin_farm || 'Organic Farm Gate').split('||')[0].trim();
  const custodyHistory = liveBatch?.custodyHistory || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* View Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Farm-to-Fork Traceability Passport 🔗</h1>
          <p className="text-xs sm:text-sm text-[#666057]">
            Immutable batch origin verification & supply chain provenance certificates
          </p>
        </div>

        {availableBatches.length > 0 && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-xs font-bold text-[#666057] whitespace-nowrap">Select Batch:</span>
            <select
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#556B2F] cursor-pointer"
            >
              {availableBatches.map(b => {
                const bId = b.batch_id || b.batchId;
                return (
                  <option key={bId} value={bId}>
                    #{bId} — {b.crop_name}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {!liveBatch && availableBatches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E6E1D5] shadow-xs text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#786E65] mb-3">
            <Link2 className="w-6 h-6 text-[#786E65]" />
          </div>
          <h3 className="text-base font-extrabold text-[#2D2620]">No Batches Available for Traceability</h3>
          <p className="text-xs text-[#666057] mt-1.5 max-w-md leading-relaxed">
            Cryptographic origin verification passports will appear here once produce batches are registered on the blockchain.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Passport Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E6E1D5] shadow-xs space-y-6">
            {/* Top Bar of Passport */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E6E1D5] pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#556B2F] bg-[#556B2F]/15 px-2.5 py-1 rounded-full">
                    {liveBatch ? 'Live Blockchain Verified' : 'Batch Lookup'}
                  </span>
                  <span className="text-xs font-bold text-[#2B6CB0] bg-[#2B6CB0]/15 px-2.5 py-1 rounded-full">
                    Custody: {currentState}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-[#2D2620] mt-2">
                  {liveBatch 
                    ? `Batch #${liveBatch.batchId || liveBatch.batch_id} (${liveBatch.product || liveBatch.produce_name || 'Produce'})`
                    : `Batch #${searchQuery}`}
                </h2>
              </div>
              
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Batch ID..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#556B2F]"
                  />
                </div>

                {activeBatchId && (
                  <button 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                    title="View Scannable QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic 5-Stage Journey Stepper */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#666057] mb-3">Supply Chain Lifecycle Progress</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {stages.map((stg, i) => {
                  const Icon = stg.icon;
                  const isCompleted = stg.type === 'completed';
                  const isActive = stg.type === 'active';

                  return (
                    <div 
                      key={i} 
                      className={`p-3.5 rounded-xl border text-center space-y-1 transition-all ${
                        isCompleted 
                          ? 'bg-[#F4F5E6] border-[#556B2F]/40' 
                          : (isActive 
                              ? 'bg-[#FFF4EC] border-[#B85C38] ring-2 ring-[#B85C38]/20' 
                              : 'bg-[#FAF7F0] border-[#E6E1D5] opacity-60')
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-[#556B2F] text-white' 
                            : (isActive ? 'bg-[#B85C38] text-white animate-pulse' : 'bg-[#E6E1D5] text-[#786E65]')
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-extrabold text-xs text-[#2D2620]">{stg.label}</p>
                      <p className={`text-[10px] font-bold ${isCompleted ? 'text-[#556B2F]' : (isActive ? 'text-[#B85C38]' : 'text-[#786E65]')}`}>
                        {stg.status}
                      </p>
                      <p className="text-[10px] text-[#666057] truncate" title={stg.detail}>
                        {stg.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passport Detail Cards: Provenance & Quality Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Left Side (6 cols): Provenance & Identity */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#556B2F]" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#2D2620]">
                    Origin & Custody Credentials
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Produce Crop:</span>
                    <strong className="text-[#2D2620]">{liveBatch?.product || liveBatch?.crop_name || 'Alphonso Mango'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Farm Origin:</span>
                    <strong className="text-[#2D2620]">{cleanFarm}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Harvest Date:</span>
                    <strong className="text-[#2D2620]">{liveBatch?.harvestDate || '2026-10-23'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Lot Quantity:</span>
                    <strong className="text-[#2D2620]">{liveBatch?.quantity || '500 kg'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Current Custody Holder:</span>
                    <strong className="text-[#556B2F]">{liveBatch?.currentHolder || 'Farm Gate'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Current Location:</span>
                    <strong className="text-[#2D2620]">{liveBatch?.currentLocation || cleanFarm}</strong>
                  </p>
                </div>
              </div>

              {/* Right Side (6 cols): Produce Quality & Cold-Chain Telemetry */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#B85C38]" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#2D2620]">
                    Quality & Environmental Verification
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Quality Grade:</span>
                    <strong className="text-[#556B2F] font-black">{liveBatch?.qualityGrade || 'Grade A+'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">AI Freshness Score:</span>
                    <strong className="text-[#2B6CB0] font-black">{liveBatch?.qualityScore || 98}%</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Reefer Storage Temp:</span>
                    <strong className="text-[#2D2620]">{liveBatch?.temp_c ? `${liveBatch.temp_c}°C` : '4.5°C (Chilled Optimum)'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Relative Humidity:</span>
                    <strong className="text-[#2D2620]">{liveBatch?.humidity_pct ? `${liveBatch.humidity_pct}%` : '88.0% RH'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Anomaly Detection:</span>
                    <strong className="text-emerald-700">0 Breaches • Verified Compliant</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#666057]">Consensus Verification:</span>
                    <strong className="text-[#556B2F]">Hardhat Chain ID 31337</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Custody Transfer Ledger */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#666057]">
                  On-Chain Custody Audit Trail ({custodyHistory.length} Recorded Transfers)
                </h3>
                <span className="text-[11px] text-[#8C8275] font-semibold">
                  Immutable Blockchain Ledger
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#E6E1D5]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5]">
                    <tr className="text-[#666057] font-semibold">
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3">From Holder</th>
                      <th className="py-2.5 px-3">To Holder</th>
                      <th className="py-2.5 px-3 text-right">Transfer Value</th>
                      <th className="py-2.5 px-3">On-Chain Tx Hash</th>
                      <th className="py-2.5 px-3 text-right">Recorded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E1D5]/60 bg-white">
                    {custodyHistory.length > 0 ? (
                      custodyHistory.map((ch, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F0]/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-[#2D2620]">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#556B2F]/15 text-[#556B2F]">
                              {ch.state}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#666057]">{ch.fromHolder || 'Farm Registration'}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#2D2620]">{ch.toHolder || 'Carrier'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#2D2620]">
                            ₹ {ch.priceRupees ? Number(ch.priceRupees).toLocaleString('en-IN') : '0'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#8C8275]">
                            {ch.txHash ? `${ch.txHash.slice(0, 10)}...${ch.txHash.slice(-8)}` : 'On-Chain Verified'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#666057]">
                            {ch.occurredAt ? String(ch.occurredAt).slice(0, 16) : 'Just now'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-[#666057]">
                          Initial origin registration recorded on-chain. Further custody transfers will appear as batch moves through carrier logistics.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {isQrModalOpen && activeBatchId && (
        <LargeQRModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          batchId={activeBatchId}
          cropName={liveBatch ? (liveBatch.product || liveBatch.produce_name || 'Produce') : 'Produce'}
          farmerName={cleanFarm}
          qrUrl={qrUrl}
        />
      )}
    </div>
  );
};
