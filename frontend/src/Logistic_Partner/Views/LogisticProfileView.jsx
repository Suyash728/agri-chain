import React, { useState } from 'react';
import { User, ShieldCheck, ChevronRight, LogOut, ArrowLeft, Settings, Bell, FileText, HelpCircle, X, Check, Truck, Phone, Key, Radio } from 'lucide-react';

export const LogisticProfileView = ({ onLogout, onBack }) => {
  const [activeModal, setActiveModal] = useState(null); // 'settings', 'alerts', 'certs', 'help'

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
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
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 border-b border-[#E6E1D5] pb-5">
          <div className="w-16 h-16 rounded-full bg-[#354424] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white flex-shrink-0">
            VM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#2D2620]">Vikram Malhotra</h2>
              <span className="text-sm">🚛</span>
            </div>
            <p className="text-xs font-bold text-[#556B2F]">Chief Logistics Operations Manager • SafeXpress</p>
            <p className="text-xs text-[#666057] mt-0.5">vikram.malhotra@safexpress.com | +91 98765 43210</p>
          </div>
        </div>

        {/* Interactive Settings Navigation Rows */}
        <div className="space-y-2 text-xs font-bold text-[#2D2620]">
          <div 
            onClick={() => setActiveModal('settings')}
            className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚙️</span>
              <span>Account Settings & Security Credentials</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>

          <div 
            onClick={() => setActiveModal('alerts')}
            className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔔</span>
              <span>Real-Time Temperature & GPS Alert Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>

          <div 
            onClick={() => setActiveModal('certs')}
            className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">📜</span>
              <span>Cold-Chain SLA & Compliance Certifications</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>

          <div 
            onClick={() => setActiveModal('help')}
            className="p-3.5 rounded-xl border border-[#E6E1D5] flex items-center justify-between hover:bg-[#FAF7F0] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">❓</span>
              <span>Help, Support & Toll-Free Dispatch Helpline</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C8275]" />
          </div>
        </div>

        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full py-3.5 bg-[#B85C38] hover:bg-[#9E4D1B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-4 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Logout of SafeXpress Logistics</span>
          </button>
        )}
      </div>

      {/* Modal 1: Account Settings & Security */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#354424]" />
                <h3 className="text-lg font-extrabold text-[#2D2620]">Account & Blockchain Security</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="text-[#666057] block font-semibold">Web3 Signer Address</span>
                <span className="font-mono font-extrabold text-[#2D2620] break-all">0x70997970C51812dc3A010C7d01b50e0d17dc79C8</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex justify-between items-center">
                <span className="text-[#666057] font-semibold">Smart Contract Role</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3E8] text-[#354424] font-bold border border-[#D4E4CE]">LOGISTICS_ROLE</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex justify-between items-center">
                <span className="text-[#666057] font-semibold">Carrier Interstate License</span>
                <span className="font-extrabold text-[#2D2620]">MH-LOG-2024-8842</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex justify-between items-center">
                <span className="text-[#666057] font-semibold">Active Reefer Fleet</span>
                <span className="font-extrabold text-[#354424]">12 Certified Vehicles</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Temperature & GPS Preferences */}
      {activeModal === 'alerts' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#B85C38]" />
                <h3 className="text-lg font-extrabold text-[#2D2620]">Telemetry Alert Preferences</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#2D2620] block">Reefer Temp Breach Alerts (&gt; 8.0°C)</span>
                  <span className="text-[11px] text-[#666057]">Instant push notification & driver dispatch alarm</span>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#354424] text-white flex items-center justify-center text-xs font-bold">✓</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#2D2620] block">GPS Geofence Route Deviation</span>
                  <span className="text-[11px] text-[#666057]">Trigger warning if reefer vehicle exits NH corridor</span>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#354424] text-white flex items-center justify-center text-xs font-bold">✓</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#2D2620] block">Smart Seal Tamper Sensor</span>
                  <span className="text-[11px] text-[#666057]">Immediate on-chain anomaly broadcast on door breach</span>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#354424] text-white flex items-center justify-center text-xs font-bold">✓</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: SLA & Certifications */}
      {activeModal === 'certs' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#556B2F]" />
                <h3 className="text-lg font-extrabold text-[#2D2620]">Cold-Chain SLA Certifications</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#2D2620]">ISO 22000:2018</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <p className="text-[11px] text-[#666057] mt-1">Food Safety Management System for cold-chain transportation.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#2D2620]">WHO Good Distribution Practices (GDP)</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">CERTIFIED</span>
                </div>
                <p className="text-[11px] text-[#666057] mt-1">Compliant temperature calibration logs with automated IoT logging.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#2D2620]">FSSAI Central Food Logistics License</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">VERIFIED</span>
                </div>
                <p className="text-[11px] text-[#666057] mt-1">License No: 10019022009841 • Valid thru Oct 2028.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Help & Support */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#354424]" />
                <h3 className="text-lg font-extrabold text-[#2D2620]">Operations Support Desk</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-2">
                <span className="font-extrabold text-[#2D2620] block">24/7 Logistics Dispatch Helpline</span>
                <div className="flex items-center gap-2 text-sm font-black text-[#354424]">
                  <Phone className="w-4 h-4" />
                  <span>1800-419-AGRI (Toll Free)</span>
                </div>
                <p className="text-[11px] text-[#666057]">Dedicated support for transit reefer breakdowns, route checkpoints, and smart seal resets.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
                <span className="font-extrabold text-[#2D2620] block">SafeXpress Control Hub</span>
                <p className="text-[11px] text-[#666057]">controlroom@safexpress-agri.com</p>
                <p className="text-[11px] text-[#666057]">NH-48 Logistics Hub, Chakan, Pune - 410501</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
