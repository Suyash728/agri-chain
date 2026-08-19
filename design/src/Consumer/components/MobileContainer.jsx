import React from 'react';
import { Wifi, Signal, Battery } from 'lucide-react';

export const MobileContainer = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#FAF7F0] flex flex-col justify-start items-center select-none font-sans transition-all">
      <div className="w-full min-h-screen bg-[#FAF7F0] text-[#2D2620] overflow-hidden relative flex flex-col">
        
        {/* Mobile-Only Status Bar (9:41) - Visible on mobile screens (< md) */}
        <div className="bg-[#FAF7F0] px-6 pt-3 pb-1 flex justify-between items-center z-40 flex-shrink-0 text-xs font-bold text-[#2D2620] md:hidden border-b border-[#E6E1D5]">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[#2D2620]">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-[#2D2620]" />
          </div>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative w-full">
          {children}
        </div>

      </div>
    </div>
  );
};
