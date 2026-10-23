import React, { useState, useEffect } from 'react';
import { Building2, Thermometer, ShieldCheck } from 'lucide-react';

export const StorageView = () => {
  const [liveWarehouses, setLiveWarehouses] = useState([]);

  const loadWarehouses = () => {
    fetch('http://localhost:8000/logistics/storage')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLiveWarehouses(data);
        else setLiveWarehouses([]);
      })
      .catch(() => setLiveWarehouses([]));
  };

  useEffect(() => {
    loadWarehouses();
    window.addEventListener('agrichain-data-reset', loadWarehouses);
    window.addEventListener('agrichain-data-updated', loadWarehouses);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadWarehouses);
      window.removeEventListener('agrichain-data-updated', loadWarehouses);
    };
  }, []);

  const warehouses = liveWarehouses;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Storage & Warehouse Infrastructure 🏢</h1>
          <p className="text-xs sm:text-sm text-[#666057]">Monitor storage capacity utilization, temperature sensors & booking allocations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-[#E6E1D5] text-sm text-[#666057] font-semibold">
            No storage facilities registered yet.
          </div>
        ) : (
          warehouses.map((wh, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <img src="/images/warehouse_3d.png" alt="Warehouse" className="w-12 h-12 object-contain" />
                <div>
                  <h3 className="font-extrabold text-base text-[#2D2620]">{wh.name}</h3>
                  <span className="text-xs text-[#666057] font-medium">{wh.location}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#666057]">Storage Occupancy</span>
                  <span className="font-bold text-[#354424]">{wh.utilized} / {wh.capacity} ({wh.pct}%)</span>
                </div>
                <div className="w-full bg-[#FAF7F0] h-2.5 rounded-full overflow-hidden border border-[#E6E1D5]/40">
                  <div className="bg-[#556B2F] h-full rounded-full" style={{ width: `${wh.pct}%` }}></div>
                </div>
                <p className="text-[11px] text-[#666057] mt-2 pt-2 border-t border-[#E6E1D5]/60 flex items-center justify-between">
                  <span>Climate Control:</span>
                  <span className="font-bold text-[#2B6CB0] flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> {wh.temp}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
