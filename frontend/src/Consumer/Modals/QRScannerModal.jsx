import React, { useState, useEffect } from 'react';
import { X, Keyboard, Search, RefreshCw, AlertCircle, ShieldCheck, QrCode } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

export const QRScannerModal = ({ isOpen, onClose, onFindBatch, batches = [] }) => {
  const [availableBatches, setAvailableBatches] = useState(batches);
  const [batchCode, setBatchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    if (batches && batches.length > 0) {
      setAvailableBatches(batches);
    } else {
      fetch(`${API_BASE_URL}/batches`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setAvailableBatches(data);
        })
        .catch(() => {});
    }
  }, [isOpen, batches]);

  if (!isOpen) return null;

  const handleLookup = async (codeToLookup) => {
    const target = (codeToLookup || batchCode).trim().toUpperCase();
    if (!target) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/batches/${target}/traceability`);
      if (!res.ok) {
        throw new Error(`Batch #${target} not found on AgriChain blockchain ledger.`);
      }
      const data = await res.json();
      
      const isFruit = ['mango', 'banana', 'apple'].some(f => (data.product || '').toLowerCase().includes(f));
      const cleanOrigin = (data.farmDetails || data.origin_farm || 'Maharashtra, India').split('||')[0].trim();
      const formattedProduct = {
        name: data.product ? data.product.charAt(0).toUpperCase() + data.product.slice(1) : 'Organic Produce',
        batchId: data.batchId,
        origin: cleanOrigin,
        image: isFruit ? '/images/fruits_ref.png' : '/images/vegetables_ref.png',
        stepsCount: data.steps ? data.steps.length : 0,
        currentLocation: data.currentLocation || 'In Transit'
      };

      if (onFindBatch) onFindBatch(formattedProduct);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to query batch traceability.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLookup(batchCode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4 animate-scale-in">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#354424]" />
            <span>Enter Batch / Scan QR Code</span>
          </h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#666057] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={availableBatches.length > 0 ? `e.g. ${availableBatches[0].batch_id}` : "Enter Batch ID..."}
              value={batchCode}
              onChange={(e) => {
                setBatchCode(e.target.value);
                if (error) setError(null);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E6E1D5] rounded-xl text-xs font-bold uppercase text-[#2D2620] focus:outline-none focus:border-[#354424]"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Dynamic Available Demo / Quick Batches */}
          {availableBatches.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[#666057]">Registered On-Chain Batches:</span>
              <div className="flex flex-wrap gap-1.5">
                {availableBatches.map((b) => (
                  <button
                    key={b.batch_id}
                    type="button"
                    onClick={() => {
                      setBatchCode(b.batch_id);
                      handleLookup(b.batch_id);
                    }}
                    className="py-1 px-2.5 bg-white border border-[#E6E1D5] text-[#354424] text-[10px] font-extrabold rounded-lg hover:bg-[#E6E1D5]/40 transition-colors cursor-pointer"
                  >
                    {b.crop_name} (#{b.batch_id.slice(-6)})
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !batchCode.trim()}
            className="w-full py-3 bg-[#354424] text-white text-xs font-extrabold rounded-2xl shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Querying Blockchain Ledger...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Lookup Product Journey</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
