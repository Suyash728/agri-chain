import React, { useState } from 'react';
import { X, Keyboard, Search } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, onFindBatch }) => {
  const [batchCode, setBatchCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!batchCode.trim()) return;
    onFindBatch(batchCode.toUpperCase());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-[#354424]" />
            <span>Enter Batch / QR Code</span>
          </h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#666057] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. TM1256, MG9821, PT4412"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E6E1D5] rounded-xl text-xs font-bold uppercase text-[#2D2620] focus:outline-none focus:border-[#354424]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setBatchCode('TM1256');
              }}
              className="flex-1 py-1.5 bg-white border border-[#E6E1D5] text-[#354424] text-[10px] font-extrabold rounded-xl"
            >
              Demo: TM1256
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchCode('MG9821');
              }}
              className="flex-1 py-1.5 bg-white border border-[#E6E1D5] text-[#354424] text-[10px] font-extrabold rounded-xl"
            >
              Demo: MG9821
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#354424] text-white text-xs font-extrabold rounded-2xl shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer mt-1"
          >
            Lookup Product Journey
          </button>
        </form>
      </div>
    </div>
  );
};
