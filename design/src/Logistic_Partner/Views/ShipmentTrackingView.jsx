import React, { useState, useEffect } from 'react';
import { Truck, MapPin, ShieldCheck, Thermometer, CheckCircle2, Clock, Navigation } from 'lucide-react';

export const ShipmentTrackingView = () => {
  const [shipments, setShipments] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchTraceData, setBatchTraceData] = useState(null);

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

  const activeShipment = shipments.find(s => s.batchId === selectedBatchId) || shipments[0] || null;

  useEffect(() => {
    if (!activeShipment?.batchId) {
      setBatchTraceData(null);
      return;
    }
    fetch(`http://localhost:8000/batches/${activeShipment.batchId}/traceability`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => setBatchTraceData(data))
      .catch(() => setBatchTraceData(null));
  }, [activeShipment?.batchId]);

  const state = activeShipment?.state || 'REGISTERED';
  const isInTransit = state === 'IN_TRANSIT';
  const isPostTransit = ['IN_STORAGE', 'AT_RETAIL', 'SOLD'].includes(state);
  const isPreTransit = ['REGISTERED', 'PENDING', 'CONFIRMED', 'ACCEPTED'].includes(state);

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
            <span className="text-xs font-bold text-[#666057] whitespace-nowrap">Select Shipment:</span>
            <select
              value={activeShipment ? activeShipment.batchId : ''}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#556B2F] cursor-pointer"
            >
              {shipments.map(s => (
                <option key={s.batchId} value={s.batchId}>
                  #{s.batchId} — {s.produce || s.product} ({s.status})
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
          {/* Left Side (7 cols): Route Corridor & Telemetry */}
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

            {/* Simulated Live Corridor Window */}
            <div className="w-full h-64 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-2 p-4">
                <span className="text-4xl block animate-pulse">
                  {isInTransit ? '🛣️ 🚚' : (isPostTransit ? '🏢 ✅' : '🚜 📦')}
                </span>
                
                <p className="text-sm font-extrabold text-[#2D2620]">
                  {isInTransit && `Live Highway Corridor: NH-60 Transit (${Number(activeShipment.latitude || 18.5204).toFixed(4)}, ${Number(activeShipment.longitude || 73.8567).toFixed(4)})`}
                  {isPreTransit && `Farm Gate Staging Bay: ${activeShipment.from} (${Number(activeShipment.latitude || 18.5204).toFixed(4)}, ${Number(activeShipment.longitude || 73.8567).toFixed(4)})`}
                  {isPostTransit && `Cold Storage Warehouse Hub: ${activeShipment.to} (Delivered)`}
                </p>

                <p className="text-xs text-[#666057]">
                  Assigned Vehicle: <strong className="text-[#2D2620]">{activeShipment.vehicle || activeShipment.number}</strong> ({activeShipment.driver} • {activeShipment.phone})
                </p>

                <p className="text-[11px] text-[#8C8275] pt-1">
                  {isInTransit && (
                    <>Estimated Arrival: <strong className="text-[#556B2F]">{activeShipment.eta || 'Today, 06:00 PM'}</strong> • Reefer Temp: <strong className="text-[#2B6CB0]">{activeShipment.temp}</strong></>
                  )}
                  {isPreTransit && (
                    <span className="text-amber-800 font-semibold">Produce packed & verified. Awaiting logistics fleet dispatch & custody transfer.</span>
                  )}
                  {isPostTransit && (
                    <span className="text-[#556B2F] font-semibold">Shipment received at cold-chain facility. Reefer integrity verified on-chain.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]/60 text-center">
                <p className="text-[11px] text-[#666057] font-semibold">Produce</p>
                <span className="text-xs font-extrabold text-[#2D2620] block mt-0.5 truncate">{activeShipment.produce || activeShipment.product}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]/60 text-center">
                <p className="text-[11px] text-[#666057] font-semibold">Reefer Temp</p>
                <span className="text-xs font-extrabold text-[#2B6CB0] block mt-0.5">{activeShipment.tempValue ? `${activeShipment.tempValue}°C` : activeShipment.temp}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]/60 text-center">
                <p className="text-[11px] text-[#666057] font-semibold">Quantity</p>
                <span className="text-xs font-extrabold text-[#2D2620] block mt-0.5">{activeShipment.quantity || '500 kg'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]/60 text-center">
                <p className="text-[11px] text-[#666057] font-semibold">Route Status</p>
                <span className="text-xs font-extrabold text-[#556B2F] block mt-0.5">{activeShipment.status}</span>
              </div>
            </div>
          </div>

          {/* Right Side (5 cols): Dynamic Milestone Audit Log */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-[#2D2620]">Milestone Audit Log</h3>
              <p className="text-xs text-[#666057]">Chronological custody & transit checkpoints</p>
            </div>

            <div className="space-y-4 relative pl-4 border-l-2 border-[#E6E1D5]">
              {/* Milestone 1: Farm Gate Registration */}
              <div className="relative flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#2D2620]">Farm Registration & Packaging</p>
                  <p className="text-[11px] text-[#8C8275]">
                    {activeShipment.occurredAt ? String(activeShipment.occurredAt).slice(0, 16) : 'Origin Recorded'}
                  </p>
                  <span className="text-[10px] text-[#556B2F] font-bold block mt-0.5">Completed at {activeShipment.from}</span>
                </div>
              </div>

              {/* Milestone 2: Custody Acceptance & Loading */}
              <div className="relative flex items-start gap-3">
                {isInTransit || isPostTransit ? (
                  <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 -ml-[27px] bg-white rounded-full flex-shrink-0" />
                )}
                <div>
                  <p className={`text-xs font-bold ${isInTransit || isPostTransit ? 'text-[#2D2620]' : 'text-amber-900'}`}>
                    Fleet Dispatch & Loading
                  </p>
                  <p className="text-[11px] text-[#8C8275]">
                    {isInTransit || isPostTransit 
                      ? (batchTraceData?.custodyHistory?.find(c => c.state === 'IN_TRANSIT')?.occurredAt || 'Custody Transferred') 
                      : 'Scheduled for Loading'}
                  </p>
                  <span className={`text-[10px] font-bold block mt-0.5 ${isInTransit || isPostTransit ? 'text-[#556B2F]' : 'text-amber-800'}`}>
                    {isInTransit || isPostTransit ? `Carrier: ${activeShipment.driver}` : 'Awaiting Farm Gate Departure'}
                  </span>
                </div>
              </div>

              {/* Milestone 3: Cold-Chain Highway Transit */}
              <div className="relative flex items-start gap-3">
                {isInTransit ? (
                  <Truck className="w-5 h-5 text-[#2B6CB0] -ml-[27px] bg-white rounded-full flex-shrink-0 animate-pulse" />
                ) : isPostTransit ? (
                  <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#8C8275] -ml-[25px] bg-white flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs font-bold ${isInTransit ? 'text-[#2B6CB0]' : (isPostTransit ? 'text-[#2D2620]' : 'text-[#666057]')}`}>
                    Cold-Chain Highway Transit
                  </p>
                  <p className="text-[11px] text-[#8C8275]">
                    {isInTransit ? 'Live in Transit • GPS Locked' : (isPostTransit ? 'Transit Completed' : 'Pending Departure')}
                  </p>
                  <span className="text-[10px] font-bold text-[#2B6CB0] block mt-0.5">
                    {activeShipment.temp}
                  </span>
                </div>
              </div>

              {/* Milestone 4: Storage Hub Arrival */}
              <div className="relative flex items-start gap-3">
                {isPostTransit ? (
                  <CheckCircle2 className="w-5 h-5 text-[#556B2F] -ml-[27px] bg-white rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#8C8275] -ml-[25px] bg-white flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs font-bold ${isPostTransit ? 'text-[#556B2F]' : 'text-[#666057]'}`}>
                    Warehouse Hub Arrival & Inspection
                  </p>
                  <p className="text-[11px] text-[#8C8275]">
                    {isPostTransit ? 'Verified at Facility Gate' : `ETA: ${activeShipment.eta || 'Today, 06:00 PM'}`}
                  </p>
                  <span className="text-[10px] text-[#666057] block mt-0.5">
                    Destination: {activeShipment.to}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
