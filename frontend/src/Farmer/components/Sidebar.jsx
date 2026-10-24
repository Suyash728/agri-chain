import React from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  Package, 
  ClipboardList, 
  Truck, 
  Wallet, 
  User, 
  LogOut 
} from 'lucide-react';

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-crops', label: 'My Crops', icon: Sprout },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'orders', label: 'Orders / Requests', icon: ClipboardList },
  { id: 'shipments', label: 'Shipments & Traceability', icon: Truck },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Sidebar = ({ currentTab, onSelectTab, onLogout }) => {
  return (
    <aside className="w-64 bg-[#C2CBAD] min-h-screen flex flex-col justify-between border-r border-[#B5BEA3] fixed left-0 top-0 bottom-0 z-30 hidden md:flex select-none overflow-hidden text-[#2E3A1F]">
      {/* Upper Navigation Section */}
      <div className="p-4 sm:p-5 flex flex-col gap-2.5 overflow-y-auto relative z-10 custom-scrollbar">
        {/* App Branding Header */}
        <div className="flex items-center gap-3 px-2 pt-1 mb-1">
          <div className="w-10 h-10 rounded-full bg-[#3D4E2A] flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-5 h-5 text-[#FAF7F0]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-[#2E3A1F] tracking-tight leading-none">
              AgriChain
            </h1>
            <span className="text-xs font-bold text-[#556B2F] tracking-wider uppercase block mt-0.5">
              Farmer
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isMultiLine = item.label.includes('&');

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3.5 px-4 ${
                  isMultiLine ? 'py-1.5 leading-tight' : 'py-2.5 leading-normal'
                } rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#3D4E2A] text-white shadow-sm font-bold'
                    : 'text-[#3B3028] hover:bg-[#B5BEA3]/70 hover:text-[#2E3A1F]'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#3D4E2A]'}`} />
                <span className="text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Lower Farmer Artwork & Logout Overlay */}
      <div className="relative w-full mt-auto z-10 flex flex-col justify-end h-72 overflow-hidden bg-[#C2CBAD]">
        {/* Seamless Farmer Landscape Image */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src="/images/farmer_sidebar_seamless_perfect.png" 
            alt="Farmer Landscape" 
            className="w-full h-full object-cover object-bottom"
          />
        </div>

        {/* Top Smooth Fade Overlay for 100% seamless upper edge transition */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#C2CBAD] via-[#C2CBAD]/50 to-transparent pointer-events-none z-10" />

        {/* Logout Button overlaying bottom of farmer landscape */}
        <div className="p-4 relative z-20 mt-auto">
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#3D4E2A] hover:bg-[#2A371B] transition-colors w-full shadow-md cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
