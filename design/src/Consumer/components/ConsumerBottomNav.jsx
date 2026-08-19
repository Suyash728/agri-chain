import React from 'react';
import { Home, LayoutGrid, ShoppingBag, Receipt, User } from 'lucide-react';

export const ConsumerBottomNav = ({ activeTab, onSelectTab, cartCount = 3 }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartCount },
    { id: 'orders', label: 'Orders', icon: Receipt },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#354424] text-white px-2 py-2 flex items-center justify-around rounded-t-2xl shadow-lg border-t border-[#2D3B1E]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? 'text-white font-bold'
                : 'text-[#A3B899] hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#A3B899]'}`} />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-white text-[#354424] text-[9px] font-extrabold px-1 min-w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#354424]">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
