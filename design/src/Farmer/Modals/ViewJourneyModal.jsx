import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, QrCode, CheckCircle2, Truck, Factory, Sprout, Store, RefreshCw, Hash } from 'lucide-react';

export const ViewJourneyModal = ({ isOpen, onClose, batchId = 'BATCH-PO-2026-001' }) => {
  const [selectedBatch, setSelectedBatch] = useState(batchId);
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTraceability = (bId) => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:8000/batches/${bId}/traceability`)
      .then((res) => {
        if (!res.ok) throw new Error(`Batch #${bId} not found`);
        return res.json();
      })
      .then((data) => {
        setJourneyData(data);
      })
      .catch((err) => {
        console.warn('Traceability fetch failed:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchTraceability(selectedBatch);
    }
  }, [isOpen, selectedBatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#3D4E2A]" />
            <h3 className="text-base font-extrabold text-[#3B3028]">Verified Supply Chain Journey</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Batch Quick Switcher */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 bg-[#FAF7F0]/60 border-b border-[#E6E1D5] text-xs">
          <span className="font-bold text-[#666057]">Switch Batch:</span>
          {['BATCH-PO-2026-001', 'TM1256', 'DEMO-BATCH-001'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBatch(b)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                selectedBatch === b 
                  ? 'bg-[#2E3A1F] text-white border-[#2E3A1F]' 
                  : 'bg-white text-[#3B3028] border-[#E6E1D5] hover:bg-[#FAF7F0]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#666057]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#556B2F]" />
              <span className="text-xs font-bold">Querying on-chain custody trail...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-600 text-xs font-bold">
              {error}
            </div>
          ) : journeyData ? (
            <>
              {/* QR Code and Product Header */}
              <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E6E1D5] flex items-center justify-between">
                <div>
                  <span className="badge-confirmed text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block mb-1">
                    AI Verified & Blockchain Signed
                  </span>
                  <h4 className="text-base sm:text-lg font-extrabold text-[#3B3028] capitalize">
                    {journeyData.product} ({journeyData.farmDetails?.split(',')[0] || 'Nashik Organic'})
                  </h4>
                  <p className="text-xs text-[#786E65] font-mono mt-0.5">
                    Batch ID: {journeyData.batchId}
                  </p>
                  <p className="text-[11px] text-[#556B2F] font-bold mt-1">
                    Current Location: {journeyData.currentLocation || 'In Transit'}
                  </p>
                </div>

                <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-[#E6E1D5] flex flex-col items-center justify-center shadow-xs flex-shrink-0">
                  <QrCode className="w-10 h-10 text-[#3D4E2A]" />
                  <span className="text-[8px] font-bold text-[#7A8B52]">BLOCKCHAIN QR</span>
                </div>
              </div>

              {/* Timeline steps */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#786E65]">
                  Step-by-Step Blockchain Audit Log ({journeyData.steps?.length || 0} Stages)
                </h4>

                {(journeyData.steps || []).map((step, idx) => {
                  const isCompleted = step.status === 'Completed' || step.status === 'Delivered';
                  const isInTransit = step.status === 'In Transit';

                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold mt-0.5 flex-shrink-0 ${
                        isCompleted ? 'bg-[#E3EBD3] text-[#3D5220] border-[#7A8B52]' :
                        isInTransit ? 'bg-[#FCEAD8] text-[#A3521E] border-[#B85C38]' :
                        'bg-white text-[#786E65] border-[#E6E1D5]'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs sm:text-sm font-bold text-[#3B3028]">{step.name}</h5>
                          <span className="text-[10px] font-semibold text-[#786E65]">{step.timestamp || step.date}</span>
                        </div>
                        <p className="text-xs text-[#786E65] mt-0.5">{step.location || step.note}</p>
                        {step.holder && (
                          <div className="text-[11px] text-[#556B2F] font-semibold mt-1">
                            Custodian: {step.holder}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custody Transaction Hashes */}
              {journeyData.custodyHistory && journeyData.custodyHistory.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#E6E1D5]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#786E65] flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#556B2F]" />
                    <span>On-Chain Transaction Receipts</span>
                  </h4>
                  <div className="space-y-1.5">
                    {journeyData.custodyHistory.map((c, cIdx) => (
                      <div key={cIdx} className="p-2 rounded-xl bg-white border border-[#E6E1D5] text-[10px] font-mono flex items-center justify-between">
                        <span className="font-bold text-[#2D2620]">{c.state}:</span>
                        <span className="text-[#556B2F] truncate ml-2">0x{c.txHash?.slice(0, 18)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

