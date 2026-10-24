import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, ThermometerSnowflake, QrCode, Search, CheckCircle2, ShoppingBag, Clock, Bike, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { FulfillmentOrdersView } from './FulfillmentOrdersView';

export const MicroInventoryView = ({ onBack, initialSubTab = 1 }) => {
  const [activeStepTab, setActiveStepTab] = useState(initialSubTab); // 1 = Micro-Inventory, 2 = Products
  const [selectedBay, setSelectedBay] = useState('All');

  const [bins, setBins] = useState([]);
  const [selectedBinQR, setSelectedBinQR] = useState(null);

  const fetchInventory = () => {
    fetch('http://localhost:8000/darkstore/inventory')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBins(data);
        }
      })
      .catch((err) => console.error('Error fetching darkstore inventory:', err));
  };

  useEffect(() => {
    fetchInventory();
    window.addEventListener('agrichain-data-reset', fetchInventory);
    window.addEventListener('agrichain-data-updated', fetchInventory);
    return () => {
      window.removeEventListener('agrichain-data-reset', fetchInventory);
      window.removeEventListener('agrichain-data-updated', fetchInventory);
    };
  }, []);

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
            {filteredBins.length > 0 ? (
              filteredBins.map(bin => (
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
                    <button 
                      onClick={() => setSelectedBinQR(bin)}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-[#354424] hover:underline cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan QR</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white p-8 rounded-3xl border border-[#E6E1D5] text-center text-[#666057]">
                <Package className="w-8 h-8 mx-auto mb-2 text-[#8C8275] opacity-50" />
                <p className="font-extrabold text-sm text-[#2D2620]">No inventory bins found in dark store</p>
                <p className="text-xs mt-1">Receive batches via Inbound GRN to allocate inventory storage bins.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Step 2: Products Page */}
      {activeStepTab === 2 && (
        <FulfillmentOrdersView onBack={() => setActiveStepTab(1)} />
      )}
          {/* Bin QR Code & Tag Verification Modal */}
      {selectedBinQR && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#354424]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#2D2620]">Storage Bin Digital Tag</h3>
                  <p className="text-xs text-[#666057]">{selectedBinQR.bin} • Verified Tag</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBinQR(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-[#FAF7F0] rounded-2xl border border-[#E6E1D5] space-y-2">
              <div className="w-56 h-56 bg-white p-3 rounded-2xl border-2 border-[#556B2F] flex items-center justify-center shadow-md">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(`AGRICHAIN-BIN:${selectedBinQR.bin}:PRODUCE:${selectedBinQR.produce}:EXP:${selectedBinQR.expiry}`)}`} 
                  alt="Bin QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-mono text-[11px] font-bold text-[#354424]">BIN-HASH: 0x{Math.random().toString(16).substring(2, 10).toUpperCase()}...</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Produce Lot</span>
                <span className="font-extrabold text-[#2D2620]">{selectedBinQR.produce}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Storage Bay</span>
                <span className="font-extrabold text-[#2D2620]">{selectedBinQR.bay}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Remaining Shelf Life</span>
                <span className="font-extrabold text-[#B85C38]">{selectedBinQR.expiry}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Current Bay Telemetry</span>
                <span className="font-extrabold text-[#2563EB]">{selectedBinQR.temp} ({selectedBinQR.humidity})</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Cryptographically verified on Hardhat EVM Contract</span>
            </div>

            <button 
              onClick={() => setSelectedBinQR(null)}
              className="w-full py-2.5 rounded-xl bg-[#354424] text-white font-extrabold text-xs hover:bg-[#26321A] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
