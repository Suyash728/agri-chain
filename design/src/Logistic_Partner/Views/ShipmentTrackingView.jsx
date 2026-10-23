import React, { useState, useEffect } from 'react';
import { MapPin, Truck, CheckCircle2, Clock, Navigation } from 'lucide-react';

export const ShipmentTrackingView = () => {
  const [shipments, setShipments] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const loadShipments = () => {
    fetch('http://localhost:8000/logistics/shipments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setShipments(data);
          if (data.length > 0 && !selectedBatchId) {
            setSelectedBatchId(data[0].batchId);
          }
        } else {
          setShipments([]);
        }
      })
      .catch(() => setShipments([]));
  };

  useEffect(() => {
    loadShipments();
    window.addEventListener('agrichain-data-reset', loadShipments);
    window.addEventListener('agrichain-data-updated', loadShipments);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadShipments);
      window.removeEventListener('agrichain-data-updated', loadShipments);
    };
  }, [selectedBatchId]);

  const activeShipment = shipments.find(s => s.batchId === selectedBatchId) || shipments[0];

  const now = new Date();
  const formatTime = (offsetHours) => {
    const d = new Date(now.getTime() - offsetHours * 3600000);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const formatEta = (offsetHours) => {
    const d = new Date(now.getTime() + offsetHours * 3600000);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Live Shipment GPS Tracking 📍</h1>
          <p className="text-xs sm:text-sm text-[#666057]">
            {activeShipment 
              ? `Real-time transit telemetry, milestone log & route simulation for Shipment #${activeShipment.batchId}`
              : 'Real-time transit telemetry & milestone audit log'}
          </p>
        </div>

        {shipments.length > 0 && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-xs font-bold text-[#666057] whitespace-nowrap">Shipment:</span>
            <select
              value={activeShipment ? activeShipment.batchId : ''}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#556B2F] cursor-pointer"
            >
              {shipments.map(s => (
                <option key={s.batchId} value={s.batchId}>
                  #{s.batchId} — {s.product} ({s.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!activeShipment ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E6E1D5] shadow-xs text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#786E65] mb-3">
            <MapPin className="w-6 h-6 text-[#786E65]" />
          </div>
          <h3 className="text-base font-extrabold text-[#2D2620]">No Active Shipments in Transit</h3>
          <p className="text-xs text-[#666057] mt-1.5 max-w-md leading-relaxed">
            Live GPS corridor telemetry, driver speed, and milestone tracking logs will automatically stream when a shipment is en route from farm gate to cold storage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-base text-[#2D2620]">Shipment #{activeShipment.batchId}</span>
                <p className="text-xs text-[#666057]">{activeShipment.from} → {activeShipment.to}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeShipment.badge || 'bg-[#556B2F]/15 text-[#556B2F]'}`}>
                {activeShipment.status}
              </span>
            </div>

            <div className="w-full h-64 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-2 p-4">
                <span className="text-3xl">🛣️ 🚚</span>
                <p className="text-sm font-bold text-[#2D2620]">
                  Live GPS Corridor: NH-60 Highway Transit ({Number(activeShipment.latitude || 18.5204).toFixed(4)}, {Number(activeShipment.longitude || 73.8567).toFixed(4)})
                </p>
                <p className="text-xs text-[#666057]">
                  Vehicle: <strong className="text-[#2D2620]">{activeShipment.number}</strong> ({activeShipment.driver}) | Temp: <strong className="text-[#2B6CB0]">{activeShipment.temp}</strong>
                </p>
                <p className="text-[11px] text-[#8C8275] pt-1">
                  Estimated Arrival: <strong className="text-[#556B2F]">{activeShipment.eta || 'Today, 06:00 PM'}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-[#2D2620]">Milestone Audit Log</h3>

            <div className="space-y-4 relative pl-4 border-l-2 border-[#E6E1D5]">
              <div className="relative flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full" />
                <div>
                  <p className="text-xs font-bold text-[#2D2620]">Order Confirmed & Custody Initialized</p>
                  <p className="text-[11px] text-[#8C8275]">{activeShipment.occurredAt ? String(activeShipment.occurredAt).slice(0, 16) : formatTime(6)}</p>
                </div>
              </div>

              <div className="relative flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full" />
                <div>
                  <p className="text-xs font-bold text-[#2D2620]">Farm Gate Pickup Completed</p>
                  <p className="text-[11px] text-[#8C8275]">{formatTime(4)}</p>
                </div>
              </div>

              <div className="relative flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#2B6CB0] -ml-[27px] bg-white rounded-full" />
                <div>
                  <p className="text-xs font-bold text-[#2B6CB0]">Cold-Chain Highway Transit</p>
                  <p className="text-[11px] text-[#8C8275]">{formatTime(1)}</p>
                </div>
              </div>

              <div className="relative flex items-start gap-3 opacity-60">
                <div className="w-4 h-4 rounded-full border-2 border-[#8C8275] -ml-[25px] bg-white" />
                <div>
                  <p className="text-xs font-bold text-[#666057]">Warehouse Arrival & Inspection</p>
                  <p className="text-[11px] text-[#8C8275]">{formatEta(3)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
