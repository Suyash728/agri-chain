import React from 'react';
import { Bell, Calendar } from 'lucide-react';
import { farmerProfile } from '../../data/mockData';

export const Header = ({ onOpenNotifications, unreadCount = 3 }) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-1">
      {/* Greeting Title */}
      <div>
        <span className="text-xs font-semibold text-[#786E65] uppercase tracking-wider block mb-0.5">
          Good morning,
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B3028] tracking-tight flex items-center gap-2">
          {farmerProfile.name} <span className="text-xl sm:text-2xl">{farmerProfile.emoji}</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#786E65] mt-1 font-medium">
          Here's what's happening on your farm today.
        </p>
      </div>

      {/* Header Actions (Notification Bell & Date Selector) */}
      <div className="flex items-center gap-3 self-start sm:self-auto">
        {/* Notification Bell */}
        <button 
          onClick={onOpenNotifications}
          className="relative w-10 h-10 rounded-full bg-white border border-[#E2DDD2] flex items-center justify-center text-[#3B3028] hover:bg-[#FAF7F0] transition-colors shadow-sm"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#3D4E2A]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3D4E2A] text-white text-[11px] font-bold flex items-center justify-center shadow">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#E2DDD2] text-xs font-semibold text-[#3B3028] shadow-sm">
          <span>12 May, 2025</span>
          <Calendar className="w-4 h-4 text-[#7A8B52]" />
        </div>
      </div>
    </header>
  );
};
