import React from 'react';
import { MapPin, Truck, CheckCircle2, Clock } from 'lucide-react';

export const ShipmentTrackingView = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Live Shipment GPS Tracking 📍</h1>
        <p className="text-xs sm:text-sm text-[#666057]">Real-time transit telemetry, milestone log & route simulation for Shipment #SHP5678</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-extrabold text-base text-[#2D2620]">Shipment #SHP5678</span>
              <p className="text-xs text-[#666057]">Nashik, MH → Pune, MH</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#556B2F]/15 text-[#556B2F]">In Transit (ETA: 14 May)</span>
          </div>

          <div className="w-full h-64 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] flex items-center justify-center relative overflow-hidden">
            <div className="text-center space-y-2 p-4">
              <span className="text-3xl">🛣️ 🚚</span>
              <p className="text-sm font-bold text-[#2D2620]">Live GPS Corridor: NH-60 Highway Transit</p>
              <p className="text-xs text-[#666057]">Speed: 58 km/h | Temperature: 4.2°C Chilled Reefer | Distance Remaining: 78 km</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#2D2620]">Milestone Audit Log</h3>

          <div className="space-y-4 relative pl-4 border-l-2 border-[#E6E1D5]">
            <div className="relative flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full" />
              <div>
                <p className="text-xs font-bold text-[#2D2620]">Order Confirmed</p>
                <p className="text-[11px] text-[#8C8275]">12 May, 2025, 09:00 AM</p>
              </div>
            </div>

            <div className="relative flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full" />
              <div>
                <p className="text-xs font-bold text-[#2D2620]">Farm Gate Pickup Completed</p>
                <p className="text-[11px] text-[#8C8275]">12 May, 2025, 11:30 AM</p>
              </div>
            </div>

            <div className="relative flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#2B6CB0] -ml-[27px] bg-white rounded-full" />
              <div>
                <p className="text-xs font-bold text-[#2B6CB0]">Cold-Chain Highway Transit</p>
                <p className="text-[11px] text-[#8C8275]">13 May, 2025, 08:15 AM</p>
              </div>
            </div>

            <div className="relative flex items-start gap-3 opacity-50">
              <div className="w-4 h-4 rounded-full border-2 border-[#8C8275] -ml-[25px] bg-white" />
              <div>
                <p className="text-xs font-bold text-[#666057]">Warehouse Arrival & Inspection</p>
                <p className="text-[11px] text-[#8C8275]">14 May, 2025, 08:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
