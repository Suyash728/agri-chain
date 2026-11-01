import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, IndianRupee, Sparkles } from 'lucide-react';

export const RecordSaleModal = ({ isOpen, onClose, onSuccess, defaultBatchId = '' }) => {
  const [batchId, setBatchId] = useState(defaultBatchId);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [consumerRef, setConsumerRef] = useState('Consumer Quick Delivery (Doorstep)');
  const [basePrice, setBasePrice] = useState(0);
  const [salePriceInr, setSalePriceInr] = useState(0);
  const [batchDetails, setBatchDetails] = useState(null);
  const [fetchingBatch, setFetchingBatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/batches')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableBatches(data);
          if (!defaultBatchId && !batchId) {
            setBatchId(data[0].batch_id);
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (defaultBatchId) setBatchId(defaultBatchId);
  }, [defaultBatchId, isOpen]);

  useEffect(() => {
    if (!isOpen || !batchId.trim()) return;

    let isMounted = true;
    setFetchingBatch(true);

    fetch(`http://localhost:8000/batches/${batchId.trim().toUpperCase()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        setBatchDetails(data);
        const bPrice = Number(data.latest_price_inr) || Number(data.farmer_price_inr) || 0;
        setBasePrice(bPrice);
        const suggested = Number(data.suggested_retail_price_inr) || (bPrice > 0 ? Math.round(bPrice + 600) : 2200);
        setSalePriceInr(suggested);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setFetchingBatch(false);
      });

    return () => {
      isMounted = false;
    };
  }, [batchId, isOpen]);

  if (!isOpen) return null;

  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!batchId.trim()) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const pricePaise = Math.round(parseFloat(salePriceInr || 0) * 100);
      const res = await fetch(`http://localhost:8000/batches/${batchId.trim().toUpperCase()}/custody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_holder: consumerRef,
          state: 'SOLD',
          price_paise: pricePaise,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Sale recording failed with status ${res.status}`);
      }

      const data = await res.json();
      setTxHash(data.tx_hash);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error('Sale recording error:', err);
      setError(err.message || 'Failed to record consumer sale on blockchain.');
    } finally {
      setLoading(false);
    }
  };

  const markupAmount = Math.max(0, salePriceInr - basePrice);
  const markupPercent = basePrice > 0 ? ((markupAmount / basePrice) * 100).toFixed(0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2D2620]">Record Sale to Consumer</h3>
              <p className="text-[10px] text-[#666057]">Final farm-to-fork custody transition (SOLD)</p>
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
                <h4 className="text-sm font-extrabold text-[#2D2620]">Sale Completed & Anchored!</h4>
                <p className="text-xs text-[#666057] mt-1">
                  Batch state updated to <span className="font-bold text-[#556B2F]">SOLD</span> on smart contract.
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
            <form onSubmit={handleRecordSale} className="flex flex-col gap-3">
              {/* Batch ID */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2D2620]">Batch Identifier</label>
                  {fetchingBatch && (
                    <span className="text-[10px] text-[#8C8275] flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Fetching batch...
                    </span>
                  )}
                </div>
                {availableBatches.length > 0 ? (
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    required
                    className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-mono font-bold text-[#2D2620] focus:outline-none focus:border-[#354424] cursor-pointer"
                  >
                    {availableBatches.map((b) => (
                      <option key={b.batch_id} value={b.batch_id}>
                        {b.batch_id} ({b.crop_name} • {b.quantity})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    placeholder="Enter registered Batch ID"
                    required
                    className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-mono font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                  />
                )}
                {batchDetails && (
                  <div className="text-[10px] text-[#556B2F] font-semibold bg-[#EBF3E8] px-2.5 py-1 rounded-lg border border-[#C2E0B8] flex items-center justify-between">
                    <span>{batchDetails.crop_name} ({batchDetails.quantity})</span>
                    <span>State: {batchDetails.current_state}</span>
                  </div>
                )}
              </div>

              {/* Consumer / Channel */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2D2620]">Consumer Channel / Address</label>
                <input
                  type="text"
                  value={consumerRef}
                  onChange={(e) => setConsumerRef(e.target.value)}
                  required
                  className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>

              {/* Price Capture */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#2D2620] flex items-center justify-between">
                  <span>Consumer Checkout Price (₹ INR)</span>
                  <span className="text-[10px] text-[#556B2F] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Inherits Dark Store Base
                  </span>
                </label>

                {/* Dynamic Price Breakdown Card */}
                <div className="p-3 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-[#666057]">
                    <span className="font-medium">Dark Store Inventory Base:</span>
                    <span className="font-extrabold text-[#2D2620]">
                      ₹ {basePrice > 0 ? Number(basePrice).toLocaleString('en-IN') : '...'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#556B2F]">
                    <span className="font-medium">Doorstep Delivery & Packaging Margin:</span>
                    <span className="font-extrabold">
                      + ₹ {markupAmount.toLocaleString('en-IN')}
                      {basePrice > 0 && (
                        <span className="text-[10px] ml-1 font-semibold opacity-85">
                          ({markupPercent}%)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Quick Markup Adjustments */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#E6E1D5]/70 flex-wrap">
                    <span className="text-[10px] text-[#786E65] font-bold">Quick Add:</span>
                    <button
                      type="button"
                      onClick={() => setSalePriceInr(Math.round(basePrice + 600))}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E6E1D5] text-[10px] font-bold text-[#2D2620] hover:bg-[#E6E1D5] cursor-pointer transition-colors"
                    >
                      +₹600
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalePriceInr(Math.round(basePrice + 1000))}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E6E1D5] text-[10px] font-bold text-[#2D2620] hover:bg-[#E6E1D5] cursor-pointer transition-colors"
                    >
                      +₹1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalePriceInr(Math.round(basePrice * 1.15))}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E6E1D5] text-[10px] font-bold text-[#2D2620] hover:bg-[#E6E1D5] cursor-pointer transition-colors"
                    >
                      +15%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalePriceInr(Math.round(basePrice * 1.20))}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E6E1D5] text-[10px] font-bold text-[#2D2620] hover:bg-[#E6E1D5] cursor-pointer transition-colors"
                    >
                      +20%
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-[#666057] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={basePrice || 0}
                    step="10"
                    value={salePriceInr}
                    onChange={(e) => setSalePriceInr(parseFloat(e.target.value) || 0)}
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
                    <span>Anchoring Sale to Blockchain...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Anchor Consumer Sale</span>
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
