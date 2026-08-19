import React from 'react';
import { Bell, Calendar } from 'lucide-react';

export const LogisticHeader = ({ onOpenNotifications }) => {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <span className="text-xs sm:text-sm font-medium text-[#666057]">
          Good morning,
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
            Rahul Patil
          </h1>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#556B2F]/15 text-[#556B2F] text-xs font-bold" title="Verified Logistics Manager">
            🌿
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-[#666057] mt-1">
          Here's what's happening in your logistics operations today.
        </p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Bell Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-xl border border-[#E6E1D5] bg-white hover:bg-[#FAF7F0] text-[#2D2620] transition-colors cursor-pointer shadow-xs"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#2D2620]" />
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#354424] text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            3
          </span>
        </button>

        {/* Date Selector Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#E6E1D5] bg-white text-[#2D2620] shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-[#2D2620]">
            12 May, 2025
          </span>
          <Calendar className="w-4 h-4 text-[#666057]" />
        </div>
      </div>
    </header>
  );
};
