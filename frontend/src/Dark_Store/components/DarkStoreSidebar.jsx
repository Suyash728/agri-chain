import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  TrendingUp, 
  AlertTriangle, 
  Link2, 
  ShieldCheck, 
  Wallet, 
  User, 
  LogOut,
  Sprout
} from 'lucide-react';

export const darkStoreNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incoming-deliveries', label: 'Incoming Deliveries', icon: Truck },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'expiry-alerts', label: 'Expiry / Alerts', icon: AlertTriangle },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'traceability', label: 'Traceability', icon: Link2 },
  { id: 'blockchain-verification', label: 'Blockchain Verification', icon: ShieldCheck },
  { id: 'revenue', label: 'Revenue', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: User },
];

export const DarkStoreSidebar = ({ currentTab, onSelectTab, onLogout }) => {
  return (
    <aside className="w-64 bg-[#C2CBAD] min-h-screen flex flex-col justify-between border-r border-[#B5BEA3] fixed left-0 top-0 bottom-0 z-30 hidden md:flex select-none overflow-hidden text-[#2E3A1F]">
      {/* Upper Navigation Section */}
      <div className="p-4 sm:p-5 flex flex-col gap-2 overflow-y-auto relative z-10 [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* App Branding Header */}
        <div className="flex items-center gap-3 px-2 pt-1 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#3D4E2A] flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-5 h-5 text-[#FAF7F0]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-[#2E3A1F] tracking-tight leading-none">
              AgriChain
            </h1>
            <span className="text-xs font-bold text-[#556B2F] tracking-wider uppercase block mt-0.5">
              Dark Store
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-0.5">
          {darkStoreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'inventory' && currentTab === 'products');

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3.5 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#3D4E2A] text-white shadow-sm font-bold'
                    : 'text-[#3B3028] hover:bg-[#B5BEA3]/70 hover:text-[#2E3A1F]'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#3D4E2A]'}`} />
                <span className="text-left leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Lower Dark Store Building Artwork & Logout Overlay */}
      <div className="relative w-full mt-auto z-10 flex flex-col justify-end overflow-hidden bg-[#C2CBAD]">
        {/* Dark Store Building Landscape Image */}
        <div className="w-full relative pointer-events-none">
          <img 
            src="/images/darkstore_sidebar_artwork.png" 
            alt="Dark Store Building Landscape" 
            className="w-full h-auto object-contain block"
          />
        </div>

        {/* Seamless Upper Edge Blend Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#C2CBAD] via-[#C2CBAD]/50 to-transparent pointer-events-none z-10" />

        {/* Logout Button overlaying bottom of landscape */}
        <div className="p-4 absolute bottom-0 left-0 right-0 z-20">
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
