import React from 'react';
import { User, ShieldCheck, ChevronRight, LogOut, ArrowLeft } from 'lucide-react';

export const LogisticProfileView = ({ onLogout, onBack }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex items-center gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Logistics Manager Profile 👤</h1>
          <p className="text-xs sm:text-sm text-[#666057]">Account credentials, cold-chain certifications & operational settings</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E6E1D5] shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-[#E6E1D5] pb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#354424] shadow-xs">
            <img src="/images/cute_plant_sprout_1786382997530.jpg" alt="Rahul Patil" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#2D2620]">Rahul Patil 🌿</h2>
            <p className="text-xs font-bold text-[#556B2F]">Chief Logistics Operations Manager</p>
            <p className="text-xs text-[#666057] mt-0.5">rahul.patil@agrichain.com | +91 98765 43210</p>
          </div>
        </div>

        <div className="space-y-2 text-xs font-bold text-[#2D2620]">
          <div className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer">
            <span>⚙️ Account Settings & Security</span>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>
          <div className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer">
            <span>🔔 Real-Time Temperature & GPS Alert Preferences</span>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>
          <div className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer">
            <span>📜 Cold-Chain SLA & Compliance Certifications</span>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>
          <div className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer">
            <span>❓ Help, Support & Toll-Free Toll Line</span>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>
        </div>

        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full py-3.5 bg-[#B85C38] hover:bg-[#9E4D1B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};
