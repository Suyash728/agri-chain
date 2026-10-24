import React from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  Package, 
  ClipboardList, 
  MoreHorizontal 
} from 'lucide-react';

export const bottomNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-crops', label: 'My Crops', icon: Sprout },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export const BottomNav = ({ currentTab, onSelectTab, onOpenMore }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#3D4E2A] text-white border-t border-[#2A371B] md:hidden shadow-lg px-2 py-1.5 flex justify-around items-center">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id || (item.id === 'more' && ['shipments', 'traceability', 'ai-trust', 'earnings', 'profile'].includes(currentTab));
        
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'more') {
                onOpenMore();
              } else {
                onSelectTab(item.id);
              }
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-150 ${
              isActive 
                ? 'bg-[#2E3A1F] text-white font-semibold shadow-inner scale-105' 
                : 'text-[#D4DAC5] hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#FAF7F0]' : 'text-[#A5B38F]'}`} />
            <span className="text-[11px] leading-tight font-medium tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
