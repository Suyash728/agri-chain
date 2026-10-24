import React from 'react';
import { Bell, Calendar } from 'lucide-react';
import { useNotificationCount } from '../../utils/useNotificationCount';
import { DateRangePicker } from '../../components/DateRangePicker';

export const LogisticHeader = ({ onOpenNotifications, unreadCount }) => {
  const { count: dynamicCount, markAllAsRead } = useNotificationCount('logistics');
  const count = unreadCount !== undefined ? unreadCount : dynamicCount;

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <span className="text-xs sm:text-sm font-medium text-[#666057]">
          Good morning,
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
            Vikram Malhotra
          </h1>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#354424]/15 text-[#354424] text-xs font-bold" title="Verified Logistics Operations Command">
            🚛
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-[#666057] mt-1">
          Here's what's happening in your logistics operations today.
        </p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Bell Notifications */}
        <button
          onClick={() => {
            markAllAsRead();
            if (onOpenNotifications) onOpenNotifications();
          }}
          className="relative p-2.5 rounded-xl border border-[#E6E1D5] bg-white hover:bg-[#FAF7F0] text-[#2D2620] transition-colors cursor-pointer shadow-xs"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#2D2620]" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#354424] text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
              {count}
            </span>
          )}
        </button>

        {/* Interactive Date Range Picker */}
        <DateRangePicker initialPeriod="today" />
      </div>
    </header>
  );
};
