import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Blocks } from 'lucide-react';

export const BlockchainVerificationView = ({ selectedProduct }) => {
  const [copied, setCopied] = useState(false);
  
  const product = selectedProduct || {
    name: 'Organic Tomato',
    batchId: 'TM1256',
    origin: 'Nashik, Maharashtra'
  };

  const batchId = product.batchId ? product.batchId : 'TM1256';
  const hashString = `0x7f5e...${batchId.toLowerCase()}8etf4`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`0x7f5ea3b9c2d8etf4882199042a9b_${batchId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-5 mt-2 max-w-7xl mx-auto w-full">
        <h2 className="text-lg md:text-xl font-black text-[#2D2620]">On-Chain Blockchain Ledger Record</h2>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left Hero Shield Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs flex flex-col items-center text-center gap-3">
            <div className="w-24 h-24 rounded-3xl bg-[#354424] text-white flex items-center justify-center shadow-lg border-4 border-white">
              <ShieldCheck className="w-14 h-14 text-white" />
            </div>
            <h3 className="text-xl font-black text-[#2D2620]">{product.name} Verified</h3>
            <p className="text-xs sm:text-sm font-semibold text-[#666057]">
              This product is authentic, tamper-proof, and cryptographically verified on the AgriChain decentralized network.
            </p>
          </div>

          {/* Right Details Card */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-3.5 text-left">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#F4F5E6]">
                <span className="text-xs sm:text-sm font-semibold text-[#666057]">Batch ID</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#2D2620]">{batchId}</span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-[#F4F5E6]">
                <span className="text-xs sm:text-sm font-semibold text-[#666057]">Blockchain Hash</span>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#354424] hover:underline cursor-pointer bg-[#F4F5E6] px-2.5 py-1 rounded-md"
                >
                  <span className="font-mono">{hashString}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#354424]" />}
                </button>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-[#F4F5E6]">
                <span className="text-xs sm:text-sm font-semibold text-[#666057]">Verified Date</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#2D2620]">10 May, 2025, 11:30 AM</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-semibold text-[#666057]">Verified By</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#354424] flex items-center gap-1.5">
                  <Blocks className="w-4 h-4 text-[#354424]" />
                  <span>AgriChain Network</span>
                </span>
              </div>
            </div>

            {/* Bottom 3D Isometric Green Blocks Graphics */}
            <div className="bg-gradient-to-b from-[#EBF3E8] to-[#FAF7F0] rounded-2xl p-4 border border-[#E6E1D5] flex items-center justify-center gap-3 text-emerald-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E6E1D5] flex items-center justify-center text-emerald-700 shadow-xs">
                  <Blocks className="w-7 h-7" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E6E1D5] flex items-center justify-center text-emerald-700 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E6E1D5] flex items-center justify-center text-emerald-700 shadow-xs">
                  <Blocks className="w-7 h-7" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
