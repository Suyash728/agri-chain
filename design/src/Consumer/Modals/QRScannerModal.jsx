import React, { useState } from 'react';
import { X, Keyboard, Search, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, onFindBatch }) => {
  const [batchCode, setBatchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLookup = async (codeToLookup) => {
    const target = (codeToLookup || batchCode).trim().toUpperCase();
    if (!target) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:8000/batches/${target}/traceability`);
      if (!res.ok) {
        throw new Error(`Batch #${target} not found on AgriChain blockchain ledger.`);
      }
      const data = await res.json();
      
      const isFruit = ['mango', 'banana', 'apple'].some(f => (data.product || '').toLowerCase().includes(f));
      const formattedProduct = {
        name: data.product ? data.product.charAt(0).toUpperCase() + data.product.slice(1) : 'Organic Produce',
        batchId: data.batchId,
        origin: data.farmDetails || 'Maharashtra, India',
        image: isFruit ? '/images/fruits_ref.png' : '/images/vegetables_ref.png',
        stepsCount: data.steps ? data.steps.length : 0,
        currentLocation: data.currentLocation || 'In Transit'
      };

      onFindBatch(formattedProduct);
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
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-[#354424]" />
            <span>Enter Batch / QR Code</span>
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
              placeholder="e.g. TM1256, BATCH-PO-2026-001"
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setBatchCode('TM1256');
                handleLookup('TM1256');
              }}
              className="flex-1 py-1.5 bg-white border border-[#E6E1D5] text-[#354424] text-[10px] font-extrabold rounded-xl hover:bg-[#E6E1D5]/40 transition-colors cursor-pointer"
            >
              Demo: TM1256
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchCode('BATCH-PO-2026-001');
                handleLookup('BATCH-PO-2026-001');
              }}
              className="flex-1 py-1.5 bg-white border border-[#E6E1D5] text-[#354424] text-[10px] font-extrabold rounded-xl hover:bg-[#E6E1D5]/40 transition-colors cursor-pointer"
            >
              Demo: BATCH-PO
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#354424] text-white text-xs font-extrabold rounded-2xl shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-60"
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

