import React from 'react';
import { Wifi, Signal, Battery } from 'lucide-react';

export const MobileContainer = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#FAF7F0] flex flex-col justify-start items-center select-none font-sans transition-all">
      <div className="w-full min-h-screen bg-[#FAF7F0] text-[#2D2620] overflow-hidden relative flex flex-col">
        {/* Viewport Content */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
