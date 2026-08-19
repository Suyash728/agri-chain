import React, { useState } from 'react';
import { ArrowLeft, Package, ThermometerSnowflake, QrCode, Search, CheckCircle2, ShoppingBag, Clock, Bike, ArrowRight } from 'lucide-react';
import { FulfillmentOrdersView } from './FulfillmentOrdersView';

export const MicroInventoryView = ({ onBack, initialSubTab = 1 }) => {
  const [activeStepTab, setActiveStepTab] = useState(initialSubTab); // 1 = Micro-Inventory, 2 = Products
  const [selectedBay, setSelectedBay] = useState('All');

  const bins = [
    { binId: 'Bin A-01', bay: 'Bay A (Cold)', item: 'Fresh Farm Tomatoes', category: 'Vegetables', stock: '240 kg', capacity: '300 kg', temp: '3.1°C', humidity: '84%', quality: 'Grade A', expiry: '6 Days' },
    { binId: 'Bin A-04', bay: 'Bay A (Cold)', item: 'Organic Tomatoes', category: 'Vegetables', stock: '180 kg', capacity: '250 kg', temp: '2.8°C', humidity: '85%', quality: 'Grade A+', expiry: '8 Days' },
    { binId: 'Bin B-01', bay: 'Bay B (Ambient)', item: 'Nashik Red Onions', category: 'Grains & Roots', stock: '500 kg', capacity: '600 kg', temp: '18.5°C', humidity: '55%', quality: 'Grade A', expiry: '20 Days' },
    { binId: 'Bin B-12', bay: 'Bay B (Ambient)', item: 'Fresh Potatoes (5kg Bags)', category: 'Roots', stock: '420 kg', capacity: '500 kg', temp: '19.0°C', humidity: '58%', quality: 'Grade A', expiry: '15 Days' },
    { binId: 'Bin C-02', bay: 'Bay C (Cold)', item: 'Green Gram / Moong Dal', category: 'Pulses', stock: '310 kg', capacity: '400 kg', temp: '2.2°C', humidity: '78%', quality: 'Grade A+', expiry: '30 Days' },
    { binId: 'Bin C-08', bay: 'Bay C (Cold)', item: 'Turmeric Bales', category: 'Spices', stock: '150 kg', capacity: '200 kg', temp: '2.0°C', humidity: '80%', quality: 'Grade A', expiry: '45 Days' },
  ];

  const filteredBins = bins.filter(bin => {
    if (selectedBay === 'All') return true;
    if (selectedBay === 'Cold') return bin.bay.includes('Cold');
    if (selectedBay === 'Ambient') return bin.bay.includes('Ambient');
    return true;
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      {/* Top Numbered Step Navigation Tabs (Logistics Partner style) */}
      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-[#E6E1D5] shadow-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveStepTab(1)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${
            activeStepTab === 1
              ? 'bg-[#354424] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] hover:bg-[#E6E1D5]/60 hover:text-[#2D2620]'
          }`}
        >
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
            activeStepTab === 1 ? 'bg-white text-[#354424]' : 'bg-[#E6E1D5] text-[#666057]'
          }`}>
            1
          </span>
          <span>Micro-Inventory & Storage Bays</span>
        </button>

        <button
          onClick={() => setActiveStepTab(2)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${
            activeStepTab === 2
              ? 'bg-[#354424] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] hover:bg-[#E6E1D5]/60 hover:text-[#2D2620]'
          }`}
        >
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
            activeStepTab === 2 ? 'bg-white text-[#354424]' : 'bg-[#E6E1D5] text-[#666057]'
          }`}>
            2
          </span>
          <span>Products 📦</span>
        </button>
      </div>

      {/* Render Step 1: Micro-Inventory & Storage Bays */}
      {activeStepTab === 1 && (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
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
                  Micro-Inventory & Storage Bays
                </h1>
                <p className="text-xs text-[#666057]">Live rack bin allocations, temperature loggers & FEFO shelf-life tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {['All', 'Cold', 'Ambient'].map(bayFilter => (
                <button
                  key={bayFilter}
                  onClick={() => setSelectedBay(bayFilter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                    selectedBay === bayFilter
                      ? 'bg-[#354424] text-white'
                      : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]'
                  }`}
                >
                  {bayFilter} Bays
                </button>
              ))}
            </div>
          </div>

          {/* Storage Bins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredBins.map(bin => (
              <div key={bin.binId} className="bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs hover:border-[#7A8B52] transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30">
                    {bin.bay}
                  </span>
                  <span className="text-xs font-extrabold text-[#2D2620]">{bin.binId}</span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#2D2620]">{bin.item}</h3>
                  <p className="text-xs text-[#666057]">{bin.category} • Quality: <span className="font-bold text-[#556B2F]">{bin.quality}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF7F0] p-3 rounded-2xl border border-[#E6E1D5]">
                  <div>
                    <span className="text-[10px] text-[#666057] block font-bold">Stock / Capacity</span>
                    <span className="font-extrabold text-[#2D2620]">{bin.stock} / {bin.capacity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#666057] block font-bold">FEFO Expiry</span>
                    <span className="font-extrabold text-[#B85C38]">{bin.expiry} remaining</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6E1D5]/60">
                  <div className="flex items-center gap-1.5 text-[#2563EB] font-bold">
                    <ThermometerSnowflake className="w-4 h-4" />
                    <span>{bin.temp} ({bin.humidity})</span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] font-extrabold text-[#354424] hover:underline cursor-pointer">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Step 2: Products Page */}
      {activeStepTab === 2 && (
        <FulfillmentOrdersView onBack={() => setActiveStepTab(1)} />
      )}
    </div>
  );
};
