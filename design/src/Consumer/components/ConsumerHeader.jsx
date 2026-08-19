import React from 'react';
import { Bell, MapPin, ChevronDown, Search, Heart, ShoppingBag } from 'lucide-react';

export const ConsumerHeader = ({ 
  onNotificationClick, 
  onAddressClick, 
  onNavigate,
  activeTab = 'home',
  cartCount = 3 
}) => {
  const navItems = [
    { id: 'home', label: 'Home', emoji: '🏠' },
    { id: 'products', label: 'Products', emoji: '📦' },
    { id: 'orders', label: 'Orders', emoji: '🛍️' },
    { id: 'journey', label: 'Journey', emoji: '🌱' },
    { id: 'blockchain', label: 'Blockchain', emoji: '🔗' },
    { id: 'revenue', label: 'Revenue', emoji: '📈' },
    { id: 'scan', label: 'Scan', emoji: '📷' },
    { id: 'profile', label: 'Profile', emoji: '👤' },
  ];

  return (
    <header className="bg-[#FAF7F0] pt-3 pb-0 z-30 border-b border-[#E6E1D5] flex flex-col gap-2.5 flex-shrink-0">
      {/* 1. Top Consumer Greeting Row */}
      <div className="px-4 md:px-8 flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-[#666057]">Good morning,</span>
          <h2 className="text-lg md:text-xl font-black text-[#2D2620] flex items-center gap-1.5 leading-tight">
            Rahul Patil <span className="text-sm md:text-base">🍃</span>
          </h2>
        </div>
      </div>

      {/* 2. Search & Location Row */}
      <div className="px-4 md:px-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Delivery Address Pill */}
        <div 
          onClick={onAddressClick}
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E6E1D5] text-xs font-bold text-[#2D2620] shadow-2xs cursor-pointer hover:bg-[#F4F5E6] transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-[#354424]" />
          <span>Deliver to</span>
          <span className="font-extrabold text-[#354424]">Nashik, Maharashtra</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#666057]" />
        </div>

        {/* Search Bar Area: Search Bar -> Favorite Heart -> Cart */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          {/* Search Bar Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#666057] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search farm fresh produce, fruits, vegetables..."
              className="w-full pl-10 pr-4 py-1.5 bg-white rounded-full border border-[#E6E1D5] text-xs font-semibold text-[#2D2620] placeholder-[#666057] focus:outline-none focus:border-[#354424] shadow-2xs"
            />
          </div>

          {/* Favorites Heart Icon Button */}
          <button 
            onClick={() => onNavigate && onNavigate('favorites')}
            className="w-9 h-9 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] shadow-xs hover:bg-[#F4F5E6] transition-colors cursor-pointer flex-shrink-0"
            title="My Favorites"
          >
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </button>

          {/* Cart/Trolley Icon Button */}
          <button 
            onClick={() => onNavigate && onNavigate('cart')}
            className="relative w-9 h-9 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] shadow-xs hover:bg-[#F4F5E6] transition-colors cursor-pointer flex-shrink-0"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-[#354424]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#354424] text-white text-[10px] font-extrabold flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Horizontal Navigation Row (Zepto-style positioning directly below search/header area) */}
      <div className="px-4 md:px-8 pt-1.5 pb-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-t border-[#E6E1D5]/60 bg-white/60 backdrop-blur-xs">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate && onNavigate(item.id)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#354424] text-white shadow-xs scale-[1.02]'
                  : 'bg-white border border-[#E6E1D5] text-[#666057] hover:text-[#2D2620] hover:border-[#354424]'
              }`}
            >
              <span className="text-xs leading-none">{item.emoji}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-[#354424]' : 'bg-[#354424] text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Notification Bell Button - Positioned immediately after Profile button */}
        <button 
          onClick={onNotificationClick}
          className="relative w-9 h-9 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] shadow-xs hover:bg-[#F4F5E6] transition-colors cursor-pointer flex-shrink-0 ml-1"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-[#354424]" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#354424] text-white text-[10px] font-extrabold flex items-center justify-center border border-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
};
