import React, { useState } from 'react';
import { Bell, Calendar, ChevronDown } from 'lucide-react';
import { useNotificationCount } from '../../utils/useNotificationCount';

export const DarkStoreHeader = ({ onOpenNotifications, unreadCount }) => {
  const [selectedStore, setSelectedStore] = useState('Nashik Central Store');
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const { count: dynamicCount, markAllAsRead } = useNotificationCount('darkstore');
  const count = unreadCount !== undefined ? unreadCount : dynamicCount;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full pt-1 pb-2">
      {/* Left: Greeting & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#666057]">Good morning,</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">
            Rahul Patil
          </h1>
          <span className="text-xl">🌿</span>
        </div>
        <p className="text-xs text-[#666057] mt-1 font-medium">
          Here's what's happening in your dark store today.
        </p>
      </div>

      {/* Right Controls: Notifications, Date Pill & Store Selector */}
      <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
        {/* Notification Bell with Badge */}
        <button 
          onClick={() => {
            markAllAsRead();
            if (onOpenNotifications) onOpenNotifications();
          }}
          className="relative w-10 h-10 rounded-2xl bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-xs"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#2D2620]" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#354424] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs">
              {count}
            </span>
          )}
        </button>

        {/* Date Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620]">
          <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <Calendar className="w-4 h-4 text-[#666057]" />
        </div>

        {/* Store Selector Dropdown Pill */}
        <div className="relative">
          <button 
            onClick={() => setIsStoreOpen(!isStoreOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs text-[#2D2620] font-medium cursor-pointer hover:bg-[#FAF7F0] transition-colors"
          >
            <span className="text-[#666057] font-semibold">Store:</span>
            <span className="font-extrabold text-[#2D2620]">{selectedStore}</span>
            <ChevronDown className={`w-4 h-4 text-[#666057] ml-1 transition-transform ${isStoreOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStoreOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E6E1D5] shadow-xl py-2 z-30">
              {['Nashik Central Store', 'Pune Hub - DS-402', 'Mumbai Express - DS-108'].map((store) => (
                <button
                  key={store}
                  onClick={() => {
                    setSelectedStore(store);
                    setIsStoreOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#FAF7F0] transition-colors cursor-pointer ${
                    selectedStore === store ? 'text-[#354424] font-black bg-[#FAF7F0]' : 'text-[#2D2620]'
                  }`}
                >
                  {store}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
