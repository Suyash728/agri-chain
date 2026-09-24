import React, { useState } from 'react';
import { X, Store, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, IndianRupee } from 'lucide-react';

export const HandoffRetailerModal = ({ isOpen, onClose, onSuccess, defaultBatchId = 'BATCH-PO-2026-001' }) => {
  const [batchId, setBatchId] = useState(defaultBatchId);
  const [toHolder, setToHolder] = useState('Central Dark Store Pune Hub 2');
  const [stateTarget, setStateTarget] = useState('IN_STORAGE');
  const [priceInr, setPriceInr] = useState(1550);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleHandoff = async (e) => {
    e.preventDefault();
    if (!batchId.trim()) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const pricePaise = Math.round(parseFloat(priceInr || 0) * 100);
      const res = await fetch(`http://localhost:8000/batches/${batchId.trim().toUpperCase()}/custody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_holder: toHolder,
          state: stateTarget,
          price_paise: pricePaise,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Handoff failed with status ${res.status}`);
      }

      const data = await res.json();
      setTxHash(data.tx_hash);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error('Retailer handoff error:', err);
      setError(err.message || 'Failed to record retailer handoff on blockchain.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/20 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2D2620]">Hand Off to Retailer / Dark Store</h3>
              <p className="text-[10px] text-[#666057]">Transfer custody and record warehouse receipt price</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {txHash ? (
            <div className="py-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#2D2620]">Handoff Verified & Mined!</h4>
                <p className="text-xs text-[#666057] mt-1">
                  Batch state updated to <span className="font-bold text-[#556B2F]">{stateTarget}</span> on smart contract.
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-[10px] font-mono break-all text-left">
                  <span className="text-[#666057] block mb-0.5">EVM Transaction Hash:</span>
                  <span className="text-[#3D5220] font-bold">0x{txHash}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTxHash(null);
                  onClose();
                }}
                className="mt-2 w-full py-2.5 bg-[#354424] text-white text-xs font-extrabold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleHandoff} className="flex flex-col gap-3">
              {/* Batch ID */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2D2620]">Batch Identifier</label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g. BATCH-PO-2026-001"
                  required
                  className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-mono font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>

              {/* Destination Retailer / Dark Store */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2D2620]">Retailer / Dark Store Recipient</label>
                <input
                  type="text"
                  value={toHolder}
                  onChange={(e) => setToHolder(e.target.value)}
                  required
                  className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>

              {/* State */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2D2620]">Custody Transition State</label>
                <select
                  value={stateTarget}
                  onChange={(e) => setStateTarget(e.target.value)}
                  className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620] focus:outline-none focus:border-[#354424] cursor-pointer"
                >
                  <option value="IN_STORAGE">IN_STORAGE (Dark Store Warehouse)</option>
                  <option value="AT_RETAIL">AT_RETAIL (Retail Shelf)</option>
                </select>
              </div>

              {/* Price Capture */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2D2620] flex items-center justify-between">
                  <span>Wholesale Delivery Price (₹ INR)</span>
                  <span className="text-[10px] text-[#666057] font-semibold">Captures Price Trail</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-[#666057] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={priceInr}
                    onChange={(e) => setPriceInr(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-9 pr-4 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !batchId.trim()}
                className="w-full py-3 bg-[#354424] text-white text-xs font-extrabold rounded-2xl shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing On-Chain Handoff...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Handoff & Anchor Price</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
