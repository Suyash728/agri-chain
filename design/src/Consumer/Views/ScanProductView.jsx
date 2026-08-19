import React from 'react';
import { ArrowLeft, Image, Keyboard, Scan } from 'lucide-react';

export const ScanProductView = ({ onBack, onScanSuccess, onEnterCodeClick }) => {
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
        <h2 className="text-base font-extrabold text-[#2D2620]">Scan Product</h2>
        <div className="w-8 h-8" />
      </div>

      <div className="px-4 flex flex-col gap-4 text-center">
        {/* Subtitle */}
        <p className="text-xs font-semibold text-[#666057] px-4">
          Scan the product QR code to know its full journey
        </p>

        {/* Camera Viewfinder Dark Frame */}
        <div 
          onClick={onScanSuccess}
          className="bg-[#181C14] rounded-3xl h-[340px] relative p-6 border-2 border-[#2D3B1E] flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-inner group"
        >
          {/* Animated Scanning Beam Line */}
          <div className="absolute inset-x-6 h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-bounce top-1/3" />

          {/* Corner Frame Guides */}
          <div className="w-56 h-56 relative border-2 border-dashed border-emerald-500/40 rounded-2xl flex items-center justify-center">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

            <div className="flex flex-col items-center gap-2 text-emerald-400/80 group-hover:text-emerald-300 transition-colors">
              <Scan className="w-10 h-10 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide">Align QR Code within frame</span>
            </div>
          </div>
        </div>

        {/* 2 Bottom Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={onScanSuccess}
            className="bg-white border border-[#E6E1D5] rounded-2xl py-3 px-3 flex flex-col items-center justify-center gap-1.5 shadow-xs hover:border-[#354424] transition-all cursor-pointer"
          >
            <Image className="w-5 h-5 text-[#354424]" />
            <span className="text-xs font-extrabold text-[#2D2620]">Upload from Gallery</span>
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
