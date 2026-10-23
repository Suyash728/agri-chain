import React, { useState, useEffect } from 'react';
import { Truck, MapPin, ShieldCheck, Thermometer, ChevronRight } from 'lucide-react';

export const TransportationView = () => {
  const [fleet, setFleet] = useState([]);

  const loadFleet = () => {
    fetch('http://localhost:8000/logistics/shipments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFleet(data);
        } else {
          setFleet([]);
        }
      })
      .catch(() => setFleet([]));
  };

  useEffect(() => {
    loadFleet();
    window.addEventListener('agrichain-data-reset', loadFleet);
    window.addEventListener('agrichain-data-updated', loadFleet);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadFleet);
      window.removeEventListener('agrichain-data-updated', loadFleet);
    };
  }, []);

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
        {fleet.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-[#E6E1D5] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#786E65] mb-3">
              <Truck className="w-6 h-6 text-[#786E65]" />
            </div>
            <h3 className="text-sm font-bold text-[#2D2620]">No Active Fleet Dispatches</h3>
            <p className="text-xs text-[#666057] mt-1 max-w-sm">
              Vehicle assignments, driver credentials, and reefer telemetry streams will appear here as procurement shipments are dispatched.
            </p>
          </div>
        ) : (
          fleet.map((v, idx) => (
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
                <p className="flex items-center justify-between">
                  <span className="text-[#666057] flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-[#2B6CB0]" /> Reefer Temp:
                  </span> 
                  <span className="font-bold text-[#2B6CB0]">{v.temp}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[#666057]">Route:</span> 
                  <span className="font-bold text-[#2D2620]">{v.from} → {v.to}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[#666057]">Estimated Arrival:</span> 
                  <span className="font-bold text-[#556B2F]">{v.eta}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
