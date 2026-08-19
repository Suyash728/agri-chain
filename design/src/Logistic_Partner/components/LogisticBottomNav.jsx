import React from 'react';
import { logisticNavItems } from './LogisticSidebar';

export const LogisticBottomNav = ({ currentTab, onSelectTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#C2CBAD] border-t border-[#B5BEA3] px-2 py-1.5 shadow-lg overflow-x-auto scrollbar-none">
      <div className="flex items-center justify-between min-w-max gap-1">
        {logisticNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#3D4E2A] text-white font-bold' 
                  : 'text-[#3B3028] hover:bg-[#B5BEA3]/70'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-white' : 'text-[#3D4E2A]'}`} />
              <span className="text-[10px] whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
