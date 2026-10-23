import React, { useState, useEffect, useCallback } from 'react';
import { Link2, ShieldCheck, QrCode, CheckCircle2, Search } from 'lucide-react';
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

  const nodes = liveBatch ? [
    { 
      step: '1. Farm Gate', 
      status: 'Completed', 
      icon: '🌱', 
      detail: (liveBatch.farmDetails || liveBatch.origin_farm || 'Patil Organic Farm').split('||')[0].trim() 
    },
    { 
      step: '2. Harvest', 
      status: 'Completed', 
      icon: '🌾', 
      detail: liveBatch.harvestDate || 'Harvest Logged' 
    },
    { 
      step: '3. Quality Check', 
      status: 'Verified', 
      icon: '⚙️', 
      detail: `Grade ${liveBatch.qualityGrade || 'A+'} (${liveBatch.qualityScore || 98}%)` 
    },
    { 
      step: '4. Transit', 
      status: (liveBatch.currentLocation || '').includes('Transit') ? 'In Progress' : 'Completed', 
      icon: '🚚', 
      detail: (liveBatch.currentLocation || 'In Transit').split('||')[0].trim() 
    },
    { 
      step: '5. Retail Hub', 
      status: (liveBatch.currentLocation || '').includes('Store') ? 'Received' : 'Pending', 
      icon: '🏬', 
      detail: (liveBatch.currentLocation || '').includes('Store') ? liveBatch.currentLocation : 'En Route to Hub' 
    },
  ] : null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Farm-to-Fork Traceability Passport 🔗</h1>
          <p className="text-xs sm:text-sm text-[#666057]">Immutable batch origin verification & supply chain provenance certificates</p>
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
        <div className="bg-white rounded-2xl p-6 border border-[#E6E1D5] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E6E1D5] pb-4">
            <div>
              <span className="text-xs font-bold text-[#556B2F] bg-[#556B2F]/15 px-2.5 py-1 rounded-full">
                {liveBatch ? 'Live Blockchain Verified' : 'Batch Lookup'}
              </span>
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

          {nodes ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {nodes.map((node, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-center space-y-1">
                  <span className="text-2xl block">{node.icon}</span>
                  <p className="font-extrabold text-xs text-[#2D2620]">{node.step}</p>
                  <p className="text-[10px] font-bold text-[#556B2F]">{node.status}</p>
                  <p className="text-[10px] text-[#666057] truncate" title={node.detail}>{node.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#666057] bg-[#FAF7F0] rounded-xl border border-[#E6E1D5]">
              Batch #{searchQuery} not found. Please select an available batch above.
            </div>
          )}
        </div>
      )}

      {isQrModalOpen && activeBatchId && (
        <LargeQRModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          batchId={activeBatchId}
          cropName={liveBatch ? (liveBatch.product || liveBatch.produce_name || 'Produce') : 'Produce'}
          farmerName={(liveBatch?.farmDetails || liveBatch?.origin_farm || 'Organic Farm').split('||')[0].trim()}
          qrUrl={qrUrl}
        />
      )}
    </div>
  );
};
