import React from 'react';
import { User, ShieldCheck, ChevronRight } from 'lucide-react';

export const LogisticProfileView = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Logistics Manager Profile 👤</h1>
        <p className="text-xs sm:text-sm text-[#666057]">Account credentials, cold-chain certifications & operational settings</p>
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
      </div>
    </div>
  );
};
