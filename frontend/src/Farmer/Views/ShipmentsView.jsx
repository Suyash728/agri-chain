import React, { useState, useEffect } from 'react';
import { ArrowLeft, SlidersHorizontal, Truck, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { TraceabilityView } from './TraceabilityView';
import { API_BASE_URL } from '../../utils/api';

export const ShipmentsView = ({ onBack, onViewJourney }) => {
  // Step state: 1 = Shipments (default), 2 = Traceability
  const [activeStep, setActiveStep] = useState(1);

  // Shipments filter state & data
  const [activeTab, setActiveTab] = useState('All');
  const [shipments, setShipments] = useState([]);
  const [sortAsc, setSortAsc] = useState(false);

  const loadShipments = () => {
    fetch(`${API_BASE_URL}/farmer/shipments`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data)) setShipments(data);
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
  }, []);

  const filteredShipments = shipments.filter(ship => {
    if (activeTab === 'All') return true;
    if (activeTab === 'In Transit') return ship.status === 'In Transit';
    if (activeTab === 'Delivered') return ship.status === 'Delivered';
    if (activeTab === 'Awaiting Pickup') return ship.status === 'Awaiting Pickup';
    return true;
  });

  const displayShipments = [...filteredShipments].sort((a, b) => {
    return sortAsc ? (a.id || '').localeCompare(b.id || '') : (b.id || '').localeCompare(a.id || '');
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E1D5] shadow-xs w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#3B3028]">
            {activeStep === 1 ? 'Shipments' : 'Traceability'}
          </h1>
        </div>

        <button 
          onClick={() => setSortAsc(!sortAsc)}
          title={`Sort ${sortAsc ? 'Ascending' : 'Descending'}`}
          className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5] cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#556B2F]" />
        </button>
      </div>

      {/* TOP HORIZONTAL NUMBERED STEP TABS CONTAINER (1. Shipments | 2. Traceability 🛡️) */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#E6E1D5] shadow-xs flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none w-full">
        {/* Step 1: Shipments */}
        <button
          onClick={() => setActiveStep(1)}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            activeStep === 1
              ? 'border-[#3D4E2A] text-[#2D2620] font-extrabold'
              : 'border-transparent text-[#666057] hover:text-[#2D2620] font-bold'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
            activeStep === 1
              ? 'bg-[#3D4E2A] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]'
          }`}>
            1
          </span>
          <span className="text-sm sm:text-base">Shipments</span>
        </button>

        {/* Step 2: Traceability */}
        <button
          onClick={() => setActiveStep(2)}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            activeStep === 2
              ? 'border-[#3D4E2A] text-[#2D2620] font-extrabold'
              : 'border-transparent text-[#666057] hover:text-[#2D2620] font-bold'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
            activeStep === 2
              ? 'bg-[#3D4E2A] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]'
          }`}>
            2
          </span>
          <span className="text-sm sm:text-base flex items-center gap-1.5">
            Traceability
            <ShieldCheck className="w-4 h-4 text-[#556B2F]" />
          </span>
        </button>
      </div>

      {/* ========================================== */}
      {/* STEP 1 CONTENT: SHIPMENTS (DEFAULT)        */}
      {/* ========================================== */}
      {activeStep === 1 && (
        <div className="flex flex-col gap-4 w-full animate-fade-in">
          {/* Sub Tabs */}
          <div className="flex border-b border-[#E6E1D5] gap-4 px-2 overflow-x-auto scrollbar-none">
            {['All', 'In Transit', 'Delivered', 'Awaiting Pickup'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer whitespace-nowrap ${
                  activeTab === tab 
                    ? 'text-[#3D4E2A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#3D4E2A]' 
                    : 'text-[#786E65] hover:text-[#3B3028]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Shipments List with Warm Cream Card Backgrounds */}
          <div className="flex flex-col gap-3.5 w-full">
            {displayShipments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E6E1D5] text-sm text-[#666057] font-semibold">
                No shipments recorded for this filter.
              </div>
            ) : (
              displayShipments.map((ship) => (
                <div 
                  key={ship.id}
                  onClick={() => onViewJourney && onViewJourney(ship.batchId || ship.id || 'TM1256')}
                  style={{ backgroundColor: '#FAF7F0' }}
                  className="border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 w-full"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base sm:text-lg font-extrabold text-[#3B3028]">
                        {ship.id}
                      </span>
                      {ship.cropName && (
                        <span className="ml-2.5 text-xs font-bold text-[#556B2F]">
                          • {ship.cropName}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      ship.status && ship.status.toLowerCase().includes('quarantin')
                        ? 'bg-red-100 text-red-800 border border-red-300 font-extrabold'
                        : ship.status && ship.status.toLowerCase().includes('salvage')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                        : ship.status === 'In Transit' 
                        ? 'bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30' 
                        : ship.status === 'Delivered' 
                        ? 'bg-[#EBF3E8] text-[#3D5220] border border-[#3D5220]/30'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {ship.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex flex-col gap-1.5 text-[#786E65]">
                      <div><span className="font-bold text-[#3B3028]">Order ID</span>: <span className="font-extrabold text-[#3B3028]">{ship.orderId}</span></div>
                      <div><span className="font-bold text-[#3B3028]">Transporter</span>: <span className="font-semibold text-[#3B3028]">{ship.transporter}</span></div>
                      <div><span className="font-bold text-[#3B3028]">Date</span>: <span className="font-semibold text-[#3B3028]">{ship.date}</span></div>
                    </div>

                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center border border-[#E6E1D5] shadow-xs flex-shrink-0">
                      {ship.status === 'In Transit' ? (
                        <Truck className="w-6 h-6 text-[#B85C38]" />
                      ) : ship.status === 'Delivered' ? (
                        <CheckCircle2 className="w-6 h-6 text-[#3D5220]" />
                      ) : (
                        <Clock className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Button */}
          <div className="mt-2">
            <button 
              onClick={() => setActiveStep(2)}
              className="w-full py-4 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>View Full Shipments & Traceability</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 2 CONTENT: TRACEABILITY PAGE          */}
      {/* ========================================== */}
      {activeStep === 2 && (
        <div className="w-full animate-fade-in">
          <TraceabilityView onBack={() => setActiveStep(1)} onOpenFullJourney={onViewJourney} />
        </div>
      )}

    </div>
  );
};
