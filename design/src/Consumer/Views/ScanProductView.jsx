import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image, Keyboard, Scan, QrCode, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import { getBatchQRCodeImageUrl } from '../../utils/qrHelper';

export const ScanProductView = ({ onBack, onScanSuccess, onEnterCodeClick, batches = [] }) => {
  const [liveBatches, setLiveBatches] = useState(batches);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  useEffect(() => {
    if (batches && batches.length > 0) {
      setLiveBatches(batches);
    } else {
      fetch(`${API_BASE_URL}/batches`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setLiveBatches(data);
        })
        .catch(() => {});
    }
  }, [batches]);

  const currentBatch = liveBatches[activeBatchIndex] || null;

  const handleTriggerScan = (batchToScan) => {
    const target = batchToScan || currentBatch;
    if (onScanSuccess) {
      onScanSuccess(target);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-20">
      {/* Top Header Bar */}
      <div className="bg-[#FAF7F0] px-4 pt-3 pb-2 flex justify-between items-center sticky top-0 z-30 border-b border-[#E6E1D5]">
        <button 
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#F4F5E6] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#2D2620]" />
        </button>
        <h2 className="text-base font-extrabold text-[#2D2620]">Scan Product QR</h2>
        <div className="w-8 h-8" />
      </div>

      <div className="px-4 flex flex-col gap-4 text-center">
        {/* Subtitle */}
        <p className="text-xs font-semibold text-[#666057] px-4">
          Point camera at the produce packaging QR code to verify on-chain farm provenance
        </p>

        {/* Camera Viewfinder Frame */}
        <div 
          onClick={() => handleTriggerScan()}
          className="bg-[#181C14] rounded-3xl h-[330px] relative p-6 border-2 border-[#2D3B1E] flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-inner group"
          title="Click to Simulate Instant QR Recognition"
        >
          {/* Animated Scanning Beam Line */}
          <div className="absolute inset-x-6 h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-bounce top-1/3 z-10" />

          {/* Corner Frame Guides with Real Embedded QR Code Artwork */}
          <div className="w-56 h-56 relative border-2 border-dashed border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

            {currentBatch ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 bg-white p-1.5 rounded-xl shadow-lg border border-emerald-400/50 flex items-center justify-center">
                  <img
                    src={getBatchQRCodeImageUrl(currentBatch.batch_id, 100)}
                    alt="Active Batch QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-black text-emerald-300">
                    {currentBatch.crop_name}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400/80">
                    #{currentBatch.batch_id}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-emerald-400/80 group-hover:text-emerald-300 transition-colors">
                <Scan className="w-10 h-10 animate-pulse" />
                <span className="text-[11px] font-bold tracking-wide">Align QR Code within frame</span>
              </div>
            )}
          </div>

          <span className="text-[10px] font-bold text-emerald-400/70 mt-3 group-hover:text-emerald-300">
            Tap anywhere inside frame to scan instantly
          </span>
        </div>

        {/* Dynamic Detected Packages in Camera Range */}
        {liveBatches.length > 0 && (
          <div className="flex flex-col gap-1.5 bg-white p-3 rounded-2xl border border-[#E6E1D5] text-left shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#666057] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#556B2F]" />
              <span>Registered Packages Detected ({liveBatches.length}):</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {liveBatches.map((b, idx) => (
                <button
                  key={b.batch_id}
                  onClick={() => {
                    setActiveBatchIndex(idx);
                    handleTriggerScan(b);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeBatchIndex === idx
                      ? 'bg-[#354424] text-white border-[#354424] shadow-xs'
                      : 'bg-[#FAF7F0] text-[#2D2620] border-[#E6E1D5] hover:border-[#354424]'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{b.crop_name}</span>
                  <span className="text-[10px] opacity-75">#{b.batch_id.slice(-6)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2 Bottom Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleTriggerScan()}
            className="bg-white border border-[#E6E1D5] rounded-2xl py-3 px-3 flex flex-col items-center justify-center gap-1.5 shadow-xs hover:border-[#354424] transition-all cursor-pointer"
          >
            <Image className="w-5 h-5 text-[#354424]" />
            <span className="text-xs font-extrabold text-[#2D2620]">Scan Active Tag</span>
          </button>

          <button
            onClick={onEnterCodeClick}
            className="bg-white border border-[#E6E1D5] rounded-2xl py-3 px-3 flex flex-col items-center justify-center gap-1.5 shadow-xs hover:border-[#354424] transition-all cursor-pointer"
          >
            <Keyboard className="w-5 h-5 text-[#354424]" />
            <span className="text-xs font-extrabold text-[#2D2620]">Enter Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
