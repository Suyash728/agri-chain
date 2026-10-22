import React, { useState } from 'react';
import { ArrowLeft, Bike, Truck, MapPin, CheckCircle2, PhoneCall, ShieldCheck, X, Plus } from 'lucide-react';

export const DispatchView = ({ onBack }) => {
  const [riders, setRiders] = useState([
    { id: 'RIDER-104', name: 'Vikram Shinde', vehicle: 'EV Cargo Bike #04', order: 'PK-4021 (Blinkit)', destination: 'Dark Store #08 (2.4 km)', status: 'En Route', eta: '8 mins', podStatus: 'OTP Verified' },
    { id: 'RIDER-108', name: 'Rahul Gawli', vehicle: 'Reefer Van #12', order: 'PK-4022 (Zepto)', destination: 'Zepto Hub #12 (4.1 km)', status: 'Loading at Bay 01', eta: '15 mins', podStatus: 'Manifest Ready' },
    { id: 'RIDER-112', name: 'Amit Solanki', vehicle: 'EV Cargo Bike #09', order: 'PK-4023 (Swiggy)', destination: 'Instamart #03 (1.8 km)', status: 'Delivered', eta: 'Completed', podStatus: 'Delivered & Signed' },
  ]);

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderVehicle, setNewRiderVehicle] = useState('EV Cargo Bike #05');
  const [newRiderOrder, setNewRiderOrder] = useState('PK-4024 (Zepto Quick)');
  const [newRiderDest, setNewRiderDest] = useState('Zepto Station #04 (3.2 km)');
  const [activeCallToast, setActiveCallToast] = useState(null);

  const handleDispatchRider = (e) => {
    e.preventDefault();
    if (!newRiderName.trim()) return;
    const newRider = {
      id: `RIDER-${Math.floor(100 + Math.random() * 900)}`,
      name: newRiderName.trim(),
      vehicle: newRiderVehicle,
      order: newRiderOrder,
      destination: newRiderDest,
      status: 'Loading at Bay 02',
      eta: '12 mins',
      podStatus: 'Assigned',
    };
    setRiders([newRider, ...riders]);
    setIsDispatchModalOpen(false);
    setNewRiderName('');
  };

  const handleCallRider = (rider) => {
    setActiveCallToast(`Calling ${rider.name} (${rider.vehicle}) at +91 98765 43210...`);
    setTimeout(() => setActiveCallToast(null), 4000);
    try {
      window.location.href = 'tel:+919876543210';
    } catch (_) {}
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">
              Dispatch & Last-Mile Delivery Riders
            </h1>
            <p className="text-xs text-[#666057]">Track EV cargo riders, refrigerated vans & proof of delivery (PoD)</p>
          </div>
        </div>

        <button 
          onClick={() => setIsDispatchModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#354424] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-xs hover:bg-[#26321A] transition-colors"
        >
          <Bike className="w-4 h-4" />
          <span>Dispatch New Rider</span>
        </button>
      </div>

      {/* Riders Dispatch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {riders.map(rider => (
          <div key={rider.id} className="bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs hover:border-[#7A8B52] transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF3E8] text-[#556B2F] flex items-center justify-center font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-base text-[#2D2620] block">{rider.name}</span>
                  <span className="text-[11px] text-[#666057] font-semibold">{rider.vehicle}</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                rider.status === 'Delivered' ? 'bg-[#EBF3E8] text-[#556B2F]' : 'bg-[#FEF3C7] text-[#D97706]'
              }`}>
                {rider.status}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#666057] font-semibold">Assigned Order</span>
                <span className="font-extrabold text-[#2D2620]">{rider.order}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057] font-semibold">Destination</span>
                <span className="font-extrabold text-[#354424] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#556B2F]" /> {rider.destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057] font-semibold">Proof of Delivery</span>
                <span className="font-extrabold text-[#2563EB]">{rider.podStatus}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6E1D5]">
              <span className="text-[#666057]">ETA: <strong className="text-[#2D2620]">{rider.eta}</strong></span>
              <button 
                onClick={() => handleCallRider(rider)}
                className="flex items-center gap-1 text-xs font-bold text-[#354424] hover:underline cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Call Rider
              </button>
            </div>
          </div>
        ))}
      </div>
          {/* Call Rider Toast */}
      {activeCallToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#354424] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-bold border border-white/20">
          <PhoneCall className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{activeCallToast}</span>
        </div>
      )}

      {/* Dispatch Rider Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#354424]">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#2D2620]">Dispatch New Rider</h3>
                  <p className="text-xs text-[#666057]">Assign fulfillment order to delivery agent</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchRider} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-extrabold text-[#666057] mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahesh Shinde"
                  value={newRiderName}
                  onChange={(e) => setNewRiderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#666057] mb-1">Vehicle Assignment</label>
                <select
                  value={newRiderVehicle}
                  onChange={(e) => setNewRiderVehicle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs text-[#2D2620] focus:outline-none focus:border-[#354424]"
                >
                  <option value="EV Cargo Bike #05">EV Cargo Bike #05 (Refrigerated Box)</option>
                  <option value="EV Cargo Bike #08">EV Cargo Bike #08 (Standard)</option>
                  <option value="Reefer Van #14">Reefer Van #14 (Cold 2-4°C)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#666057] mb-1">Assigned Order ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PK-4024"
                  value={newRiderOrder}
                  onChange={(e) => setNewRiderOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#666057] mb-1">Destination & Distance</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zepto Station #04 (3.2 km)"
                  value={newRiderDest}
                  onChange={(e) => setNewRiderDest(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E6E1D5] text-[#666057] font-bold text-xs hover:bg-[#FAF7F0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#354424] text-white font-extrabold text-xs hover:bg-[#26321A] transition-colors cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
