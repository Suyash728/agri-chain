import React, { useState, useEffect } from 'react';
import { MapPin, Truck, CheckCircle2, Clock } from 'lucide-react';

export const ShipmentTrackingView = () => {
  const [activeShipment, setActiveShipment] = useState({
    batchId: 'SHP5678',
    from: 'Nashik, MH',
    to: 'Pune, MH',
    status: 'In Transit (ETA: 14 May)',
    speed: '58 km/h',
    temp: '4.2°C Chilled Reefer',
    distanceRemaining: '78 km',
    latitude: 18.5204,
    longitude: 73.8567,
  });

  useEffect(() => {
    fetch('http://localhost:8000/logistics/shipments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const s = data[0];
          setActiveShipment({
            batchId: s.batchId,
            from: s.from,
            to: s.to,
            status: `${s.status} (ETA: ${s.eta})`,
            speed: '52 km/h',
            temp: s.temp,
            distanceRemaining: '45 km',
            latitude: s.latitude,
            longitude: s.longitude,
          });
        }
      })
      .catch((err) => console.warn('Using fallback shipment tracking:', err));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Live Shipment GPS Tracking 📍</h1>
        <p className="text-xs sm:text-sm text-[#666057]">Real-time transit telemetry, milestone log & route simulation for Shipment #{activeShipment.batchId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-extrabold text-base text-[#2D2620]">Shipment #{activeShipment.batchId}</span>
              <p className="text-xs text-[#666057]">{activeShipment.from} → {activeShipment.to}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#556B2F]/15 text-[#556B2F]">{activeShipment.status}</span>
          </div>

          <div className="w-full h-64 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] flex items-center justify-center relative overflow-hidden">
            <div className="text-center space-y-2 p-4">
              <span className="text-3xl">🛣️ 🚚</span>
              <p className="text-sm font-bold text-[#2D2620]">Live GPS Corridor: NH-60 Highway Transit ({activeShipment.latitude.toFixed(4)}, {activeShipment.longitude.toFixed(4)})</p>
              <p className="text-xs text-[#666057]">Speed: {activeShipment.speed} | Temperature: {activeShipment.temp} | Distance Remaining: {activeShipment.distanceRemaining}</p>
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
