import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sprout, Wheat, Factory, Truck, Store } from 'lucide-react';

export const TraceabilityView = ({ onBack, onOpenFullJourney }) => {
  const [liveBatch, setLiveBatch] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/farmer/inventory')
      .then(r => r.json())
      .then(inv => {
        const firstItem = inv?.items?.[0];
        if (firstItem && firstItem.batchId) {
          setLiveBatch({
            batchId: firstItem.batchId,
            product: firstItem.name || 'Produce',
            quantity: firstItem.quantity || '500 kg',
            harvestDate: firstItem.harvestDate || new Date().toISOString().split('T')[0],
            currentLocation: firstItem.status || 'In Transit',
            farmDetails: (firstItem.farm || 'Nashik Organic Farm cluster 4').split('||')[0].trim(),
          });

          fetch(`http://localhost:8000/batches/${firstItem.batchId}/traceability`)
            .then(r => r.json())
            .then(data => {
              if (data && (data.batchId || data.batch_id)) {
                setLiveBatch({
                  batchId: data.batchId || data.batch_id,
                  product: data.product || data.crop_name || firstItem.name || 'Produce',
                  quantity: data.quantity || firstItem.quantity || '500 kg',
                  harvestDate: data.harvestDate || firstItem.harvestDate || 'Today',
                  currentLocation: data.currentLocation || data.current_holder || firstItem.status || 'In Transit',
                  farmDetails: (data.farmDetails || data.origin_farm || firstItem.farm || 'Nashik Organic Farm cluster 4').split('||')[0].trim(),
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const batchInfo = liveBatch || {
    batchId: "Loading...",
    product: "Fetching on-chain batch...",
    quantity: "...",
    harvestDate: "...",
    currentLocation: "...",
    farmDetails: "..."
  };

  return (
    <div className="bg-white border border-[#E6E1D5] rounded-2xl p-4 sm:p-6 shadow-xs max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#3B3028]" />
        </button>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#3B3028] tracking-tight">
          Traceability
        </h1>
      </div>

      <p className="text-xs sm:text-sm text-[#786E65] font-medium ml-12 mb-6">
        Track your produce from farm to fork
      </p>

      {/* Horizontal Stepper Diagram */}
      <div className="mb-6 px-1">
        <div className="flex items-center justify-between relative">
          {/* Step 1: Farm */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8EEDF] flex items-center justify-center mb-1.5 shadow-2xs">
              <Sprout className="w-6 h-6 text-[#3D4E2A]" />
            </div>
            <span className="text-xs font-bold text-[#3B3028]">Farm</span>
            <span className="text-[11px] font-bold text-[#556B2F] mt-0.5">Completed</span>
          </div>

          <ArrowRight className="w-4 h-4 text-[#556B2F] -mt-5" />

          {/* Step 2: Harvest */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8EEDF] flex items-center justify-center mb-1.5 shadow-2xs">
              <Wheat className="w-6 h-6 text-[#3D4E2A]" />
            </div>
            <span className="text-xs font-bold text-[#3B3028]">Harvest</span>
            <span className="text-[11px] font-bold text-[#556B2F] mt-0.5">Completed</span>
          </div>

          <ArrowRight className="w-4 h-4 text-[#556B2F] -mt-5" />

          {/* Step 3: Processing */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8EEDF] flex items-center justify-center mb-1.5 shadow-2xs">
              <Factory className="w-6 h-6 text-[#3D4E2A]" />
            </div>
            <span className="text-xs font-bold text-[#3B3028]">Processing</span>
            <span className="text-[11px] font-bold text-[#556B2F] mt-0.5">Completed</span>
          </div>

          <ArrowRight className="w-4 h-4 text-[#C86428] -mt-5" />

          {/* Step 4: Transport */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#FDEEE3] border border-[#F5C29B] flex items-center justify-center mb-1.5 shadow-2xs">
              <Truck className="w-6 h-6 text-[#C86428]" />
            </div>
            <span className="text-xs font-bold text-[#3B3028]">Transport</span>
            <span className="text-[11px] font-bold text-[#C86428] mt-0.5">In Transit</span>
          </div>

          <ArrowRight className="w-4 h-4 text-[#C86428] -mt-5" />

          {/* Step 5: Store */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#FDEEE3] border border-[#F5C29B] flex items-center justify-center mb-1.5 shadow-2xs">
              <Store className="w-6 h-6 text-[#C86428]" />
            </div>
            <span className="text-xs font-bold text-[#3B3028]">Store</span>
            <span className="text-[11px] font-bold text-[#C86428] mt-0.5">Pending</span>
          </div>
        </div>
      </div>

      {/* Batch Info Card */}
      <div 
        style={{ backgroundColor: '#FAF7F0' }}
        className="rounded-2xl p-4 sm:p-5 border border-[#E8E2D5] flex flex-col gap-3 text-xs sm:text-sm mb-6"
      >
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#3B3028]">Product</span>
          <span className="font-extrabold text-[#3B3028]">{batchInfo.product}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#3B3028]">Batch ID</span>
          <span className="font-extrabold text-[#3B3028]">{batchInfo.batchId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#3B3028]">Current Location</span>
          <span className="font-extrabold text-[#3B3028]">{batchInfo.currentLocation}</span>
        </div>
      </div>

      {/* View Full Journey Action Button */}
      <button 
        onClick={() => onOpenFullJourney && onOpenFullJourney(batchInfo.batchId !== 'Loading...' ? batchInfo.batchId : 'TM1256')}
        className="w-full py-3.5 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm rounded-xl flex items-center justify-center shadow-md transition-all active:scale-[0.99]"
      >
        View Full Journey
      </button>
    </div>
  );
};
