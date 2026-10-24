import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Database, 
  UserCheck, 
  ShieldCheck, 
  LogOut,
  Trash2
} from 'lucide-react';

export const adminNavItems = [
  { id: 'all', label: 'Console Overview', icon: LayoutDashboard },
  { id: 'circuit-breakers', label: 'Circuit Breakers', icon: Layers },
  { id: 'quarantine', label: 'Quarantine Audit', icon: Database },
  { id: 'roles', label: 'Role Governance', icon: UserCheck },
  { id: 'maintenance', label: 'Clean Slate Reset', icon: Trash2 },
];

export const AdminSidebar = ({ currentTab = 'all', onSelectTab, onLogout }) => {
  return (
    <aside className="w-64 bg-[#C2CBAD] min-h-screen flex flex-col justify-between border-r border-[#B5BEA3] fixed left-0 top-0 bottom-0 z-30 hidden md:flex select-none overflow-hidden text-[#2E3A1F]">
      {/* Upper Navigation Section */}
      <div className="p-4 sm:p-5 flex flex-col gap-2.5 overflow-y-auto relative z-10 custom-scrollbar">
        {/* App Branding Header */}
        <div className="flex items-center gap-3 px-2 pt-1 mb-1">
          <div className="w-10 h-10 rounded-full bg-[#3D4E2A] flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[#FAF7F0]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-[#2E3A1F] tracking-tight leading-none">
              AgriChain
            </h1>
            <span className="text-xs font-bold text-[#556B2F] tracking-wider uppercase block mt-0.5">
              Master Admin
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
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

      {/* Lower Security Card & Logout */}
      <div className="p-4 relative z-20 mt-auto bg-[#B5BEA3]/40 border-t border-[#B5BEA3]">
        <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E6E1D5] mb-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#2D2620] mb-0.5">
            <ShieldCheck className="w-4 h-4 text-[#3D4E2A]" />
            <span>Root Authority</span>
          </div>
          <p className="text-[10px] text-[#666057]">
            DEFAULT_ADMIN_ROLE multisig governance active.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#3D4E2A] hover:bg-[#2A371B] transition-colors w-full shadow-md cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-white" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
