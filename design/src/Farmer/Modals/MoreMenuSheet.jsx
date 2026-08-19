import React from 'react';
import { 
  Truck, 
  Wallet, 
  User, 
  LogOut, 
  X 
} from 'lucide-react';

export const MoreMenuSheet = ({ isOpen, onClose, onSelectTab, onLogout }) => {
  if (!isOpen) return null;

  const moreItems = [
    { id: 'shipments', label: 'Shipments', icon: Truck, desc: 'Active & past transport logs' },
    { id: 'earnings', label: 'Earnings', icon: Wallet, desc: 'Monthly income breakdown' },
    { id: 'profile', label: 'Profile', icon: User, desc: 'Farmer account & farm settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-[#E6E1D5] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3D4E2A]"></div>
            <h3 className="text-base font-extrabold text-[#3B3028]">More Options</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4 flex flex-col gap-2 overflow-y-auto">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E3EBD3]/60 border border-[#E6E1D5] text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#E6E1D5] text-[#3D4E2A] group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#3B3028]">{item.label}</h4>
                  <p className="text-xs text-[#786E65] font-medium">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-4 bg-[#FAF7F0] border-t border-[#E6E1D5]">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-3 bg-[#FAF7F0] hover:bg-[#FBE8E8] text-[#8B3A3A] border border-[#E8C5C5] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
