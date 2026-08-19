import React from 'react';
import { ArrowLeft, User, Building2, MapPin, Phone, Mail, ShieldCheck, ThermometerSnowflake, Sliders } from 'lucide-react';

export const DarkStoreProfileView = ({ onBack, onLogout }) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        {onBack && (
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">
            Dark Store Station Settings & Profile
          </h1>
          <p className="text-xs text-[#666057]">Manage micro-hub configuration, temperature thresholds & manager profile</p>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-[#E6E1D5]">
          <div className="w-20 h-20 rounded-full bg-[#1E293B] text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            AD
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-extrabold text-[#2D2620]">Anand Deshmukh</h2>
            <p className="text-xs font-bold text-[#556B2F]">Senior Operations Lead • Nashik Central Dark Store (DS-402)</p>
            <p className="text-xs text-[#666057]">AgriChain Micro-Fulfillment Operations Network</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
            <span className="text-[#666057] font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#354424]" /> Hub Location</span>
            <span className="font-extrabold text-[#2D2620] text-sm block">Plot 42, MIDC Ambad Industrial Zone, Nashik, MH 422010</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
            <span className="text-[#666057] font-semibold flex items-center gap-1.5"><ThermometerSnowflake className="w-3.5 h-3.5 text-[#2563EB]" /> Cold Room Thresholds</span>
            <span className="font-extrabold text-[#2D2620] text-sm block">Bay A: 2.0°C - 4.0°C | Bay B: 16°C - 20°C</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
            <span className="text-[#666057] font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#354424]" /> Manager Contact</span>
            <span className="font-extrabold text-[#2D2620] text-sm block">+91 98234 56789</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
            <span className="text-[#666057] font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#354424]" /> Official Email</span>
            <span className="font-extrabold text-[#2D2620] text-sm block">anand.deshmukh@agrichain.in</span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full py-3.5 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
        >
          Logout of Dark Store Account
        </button>
      </div>
    </div>
  );
};
