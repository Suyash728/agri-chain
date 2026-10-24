import React, { useState, useEffect } from 'react';
import { Bell, Calendar, ChevronDown, Check } from 'lucide-react';
import { useNotificationCount } from '../../utils/useNotificationCount';
import { DateRangePicker } from '../../components/DateRangePicker';

export const DarkStoreHeader = ({ onOpenNotifications, unreadCount }) => {
  const [selectedStore, setSelectedStore] = useState(() => {
    try {
      return localStorage.getItem('agrichain_selected_darkstore') || 'Pune Hub - DS-402';
    } catch {
      return 'Pune Hub - DS-402';
    }
  });
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const { count: dynamicCount, markAllAsRead } = useNotificationCount('darkstore');
  const count = unreadCount !== undefined ? unreadCount : dynamicCount;

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setIsStoreOpen(false);
    try {
      localStorage.setItem('agrichain_selected_darkstore', store);
    } catch {}
    window.dispatchEvent(new CustomEvent('agrichain-store-changed', { detail: { store } }));
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full pt-1 pb-2">
      {/* Left: Greeting & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#666057]">Good morning,</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">
            Anand Deshmukh
          </h1>
          <span className="text-xl">🏬</span>
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

        {/* Interactive Date Range Picker */}
        <DateRangePicker initialPeriod="today" />

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
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#E6E1D5] shadow-xl py-2 z-50">
              <div className="px-3 py-1 border-b border-[#E6E1D5]/60 mb-1">
                <span className="text-[10px] font-extrabold text-[#8C8275] uppercase tracking-wider block">
                  Select Active Facility
                </span>
              </div>
              {['Pune Hub - DS-402', 'Nashik Central Store', 'Mumbai Express - DS-108'].map((store) => (
                <button
                  key={store}
                  onClick={() => handleSelectStore(store)}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedStore === store ? 'text-[#354424] font-black bg-[#FAF7F0]' : 'text-[#2D2620] hover:bg-[#FAF7F0]'
                  }`}
                >
                  <span>{store}</span>
                  {selectedStore === store && <Check className="w-3.5 h-3.5 text-[#354424]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
