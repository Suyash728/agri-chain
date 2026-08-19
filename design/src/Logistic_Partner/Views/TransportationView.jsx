import React from 'react';
import { Truck, MapPin, ShieldCheck, Thermometer, ChevronRight } from 'lucide-react';

export const TransportationView = () => {
  const fleet = [
    { number: 'MH12 AB 1234', status: 'In Transit', temp: '4.2°C (Reefer Chilled)', driver: 'Ramesh Yadav', phone: '+91 98111 22233', from: 'Nashik, Maharashtra', to: 'Pune, Maharashtra', eta: '14 May, 06:00 PM', badge: 'bg-[#556B2F]/15 text-[#556B2F]' },
    { number: 'MH15 CD 5678', status: 'Loading', temp: '5.0°C (Reefer Chilled)', driver: 'Suresh Patil', phone: '+91 98222 33344', from: 'Raipur, Chhattisgarh', to: 'Nagpur, Maharashtra', eta: '15 May, 10:00 AM', badge: 'bg-[#B85C38]/15 text-[#B85C38]' },
    { number: 'UP14 EF 9101', status: 'Delivered', temp: 'Ambient (Dry Cargo)', driver: 'Arvind Kumar', phone: '+91 98333 44455', from: 'Aligarh, Uttar Pradesh', to: 'Nashik, Maharashtra', eta: '12 May, 04:00 PM', badge: 'bg-gray-100 text-gray-700' },
    { number: 'KA04 GH 2468', status: 'In Transit', temp: '3.8°C (Cold Reefer)', driver: 'Venkatesh Rao', phone: '+91 98444 55566', from: 'Belgaum, Karnataka', to: 'Mumbai Central', eta: '13 May, 11:30 PM', badge: 'bg-[#556B2F]/15 text-[#556B2F]' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Fleet & Transport Management 🚚</h1>
          <p className="text-xs sm:text-sm text-[#666057]">Real-time vehicle GPS tracking, reefer temperature telemetry & driver assignments</p>
        </div>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fleet.map((v, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] p-1 border border-[#E6E1D5] flex items-center justify-center">
                  <img src="/images/logistics_truck_kpi.png" alt="Truck" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#2D2620]">{v.number}</h3>
                  <span className="text-xs text-[#666057] font-medium">{v.driver} ({v.phone})</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${v.badge}`}>{v.status}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 text-xs space-y-1.5">
              <p className="flex items-center justify-between"><span className="text-[#666057] flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-[#2B6CB0]" /> Reefer Temp:</span> <span className="font-bold text-[#2B6CB0]">{v.temp}</span></p>
              <p className="flex items-center justify-between"><span className="text-[#666057]">Route:</span> <span className="font-bold text-[#2D2620]">{v.from} → {v.to}</span></p>
              <p className="flex items-center justify-between"><span className="text-[#666057]">Estimated Arrival:</span> <span className="font-bold text-[#556B2F]">{v.eta}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
