import React, { useState, useEffect } from 'react';
import { Truck, MapPin, ShieldCheck, Thermometer, ArrowRight, Gauge, PackageCheck } from 'lucide-react';

export const TransportationView = ({ onNavigate }) => {
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

  const totalVolumeKg = fleet.reduce((acc, item) => {
    const num = parseInt((item.quantity || '').replace(/[^0-9]/g, '')) || 500;
    return acc + num;
  }, 0);

  const avgTemp = fleet.length > 0
    ? (fleet.reduce((acc, item) => acc + (item.tempValue || 4.5), 0) / fleet.length).toFixed(1)
    : '4.5';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Fleet & Transport Management 🚚</h1>
          <p className="text-xs sm:text-sm text-[#666057]">
            Real-time vehicle GPS tracking, reefer temperature telemetry & driver assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs font-bold text-[#2D2620]">
            Active Vehicles: <strong className="text-[#556B2F]">{fleet.length}</strong>
          </span>
        </div>
      </div>

      {/* Fleet Overview KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#556B2F]/15 flex items-center justify-center text-[#556B2F] flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#2D2620] block">{fleet.length}</span>
            <p className="text-[11px] font-bold text-[#666057]">Active Fleet Trucks</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2B6CB0]/15 flex items-center justify-center text-[#2B6CB0] flex-shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#2B6CB0] block">{avgTemp}°C</span>
            <p className="text-[11px] font-bold text-[#666057]">Avg Reefer Temp</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B85C38]/15 flex items-center justify-center text-[#B85C38] flex-shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#2D2620] block">{totalVolumeKg.toLocaleString('en-IN')} kg</span>
            <p className="text-[11px] font-bold text-[#666057]">Total Produce Freight</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#354424]/15 flex items-center justify-center text-[#354424] flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#354424] block">100%</span>
            <p className="text-[11px] font-bold text-[#666057]">Cold-Chain Compliance</p>
          </div>
        </div>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#556B2F]/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7F0] p-1.5 border border-[#E6E1D5] flex items-center justify-center flex-shrink-0">
                    <img src="/images/logistics_truck_kpi.png" alt="Truck" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#2D2620]">{v.vehicle || v.number || 'MH12 AB 1234'}</h3>
                    <p className="text-xs text-[#666057] font-medium">Driver: <strong className="text-[#2D2620]">{v.driver}</strong> ({v.phone})</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${v.badge || 'bg-[#556B2F]/15 text-[#556B2F]'}`}>
                  {v.status}
                </span>
              </div>

              {/* Batch & Produce Banner */}
              <div className="px-3 py-2 bg-[#F4F5E6] rounded-xl border border-[#E6E1D5]/60 flex items-center justify-between text-xs">
                <span className="font-bold text-[#2D2620]">
                  Batch #{v.batchId}
                </span>
                <span className="text-[#556B2F] font-bold">
                  {v.produce || v.product} ({v.quantity})
                </span>
              </div>

              {/* Details Grid */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 text-xs space-y-2">
                <p className="flex items-center justify-between">
                  <span className="text-[#666057] flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#2B6CB0]" /> Reefer Temp:
                  </span> 
                  <span className="font-extrabold text-[#2B6CB0]">{v.temp}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[#666057] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#556B2F]" /> Live Coordinates:
                  </span> 
                  <span className="font-bold text-[#2D2620]">{v.coords || `${v.latitude}, ${v.longitude}`}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[#666057]">Route:</span> 
                  <span className="font-bold text-[#2D2620] text-right truncate max-w-[200px]" title={`${v.from} → ${v.to}`}>
                    {v.from} → {v.to}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[#666057]">Estimated Arrival:</span> 
                  <span className="font-extrabold text-[#556B2F]">{v.eta}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
