import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Package, 
  ShoppingBag, 
  MoreHorizontal 
} from 'lucide-react';

export const darkStoreBottomNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbound', label: 'Inbound', icon: Truck },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'fulfillment', label: 'Pick & Pack', icon: ShoppingBag },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export const DarkStoreBottomNav = ({ currentTab, onSelectTab, onOpenMore }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E293B] text-white border-t border-[#0F172A] md:hidden shadow-lg px-2 py-1.5 flex justify-around items-center">
      {darkStoreBottomNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id || (item.id === 'more' && ['dispatch', 'analytics', 'profile'].includes(currentTab));
        
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
                ? 'bg-[#0F172A] text-white font-semibold shadow-inner scale-105' 
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#FAF7F0]' : 'text-[#64748B]'}`} />
            <span className="text-[11px] leading-tight font-medium tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
