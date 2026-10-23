import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Thermometer, 
  Building2 
} from 'lucide-react';

export const InventoryView = ({ initialStep = 'available-produce', onSelectTab }) => {
  // Step state: 'available-produce' (default) | 'storage-warehouse' | 'logistics-orders'
  const [activeStep, setActiveStep] = useState(initialStep);

  // Available Produce section state & data
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [produceItems, setProduceItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categoryAllocations, setCategoryAllocations] = useState([]);

  const loadData = () => {
    fetch('http://localhost:8000/logistics/available-produce')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((d, i) => ({
            id: d.id || i,
            name: d.name || d.crop,
            category: d.category || 'Produce',
            qty: d.qty || d.quantity || '500 kg',
            price: d.price || '₹ 2,000 / Quintal',
            farm: d.farm || 'Verified Organic Farm',
            status: 'In Stock',
            icon: d.icon || '/images/tomato_only.png',
          }));
          setProduceItems(mapped);
        } else {
          setProduceItems([]);
        }
      })
      .catch(() => setProduceItems([]));

    fetch('http://localhost:8000/logistics/storage')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setWarehouses(data);
        } else {
          setWarehouses([]);
        }
      })
      .catch(() => setWarehouses([]));

    fetch('http://localhost:8000/logistics/category-allocations')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCategoryAllocations(data);
        } else {
          setCategoryAllocations([]);
        }
      })
      .catch(() => setCategoryAllocations([]));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('agrichain-data-reset', loadData);
    window.addEventListener('agrichain-data-updated', loadData);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadData);
      window.removeEventListener('agrichain-data-updated', loadData);
    };
  }, []);

  const filteredProduce = produceItems.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.farm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* TOP HORIZONTAL STEP-STYLE NAVIGATION CONTAINER */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#E6E1D5] shadow-xs flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
        
        {/* Step 1: Available Produce */}
        <button
          onClick={() => setActiveStep('available-produce')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            activeStep === 'available-produce'
              ? 'border-[#354424] text-[#2D2620] font-extrabold'
              : 'border-transparent text-[#666057] hover:text-[#2D2620] font-bold'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
            activeStep === 'available-produce'
              ? 'bg-[#354424] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]'
          }`}>
            1
          </span>
          <span className="text-sm sm:text-base">Available Produce 🌽</span>
        </button>

        {/* Step 2: Storage & Warehouse */}
        <button
          onClick={() => setActiveStep('storage-warehouse')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            activeStep === 'storage-warehouse'
              ? 'border-[#354424] text-[#2D2620] font-extrabold'
              : 'border-transparent text-[#666057] hover:text-[#2D2620] font-bold'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
            activeStep === 'storage-warehouse'
              ? 'bg-[#354424] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]'
          }`}>
            2
          </span>
          <span className="text-sm sm:text-base">Storage & Warehouse 🏢</span>
        </button>

        {/* Step 3: Logistics Central Inventory */}
        <button
          onClick={() => setActiveStep('logistics-orders')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            activeStep === 'logistics-orders'
              ? 'border-[#354424] text-[#2D2620] font-extrabold'
              : 'border-transparent text-[#666057] hover:text-[#2D2620] font-bold'
          }`}
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
            activeStep === 'logistics-orders'
              ? 'bg-[#354424] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]'
          }`}>
            3
          </span>
          <span className="text-sm sm:text-base">Logistics Central Inventory 📊</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* STEP 1 CONTENT: AVAILABLE PRODUCE (DEFAULT) */}
      {/* ========================================== */}
      {activeStep === 'available-produce' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Categories Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search produce, farm location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E1D5] bg-white text-xs sm:text-sm text-[#2D2620] focus:outline-none focus:border-[#354424]"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {['All', 'Grains', 'Vegetables', 'Pulses', 'Spices'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat ? 'bg-[#354424] text-white shadow-xs' : 'bg-white text-[#666057] border border-[#E6E1D5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Available Produce Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProduce.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-[#E6E1D5] text-sm text-[#666057] font-semibold">
                No produce items found matching the selected filter.
              </div>
            ) : (
              filteredProduce.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] p-1.5 border border-[#E6E1D5] flex items-center justify-center">
                        <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'In Stock' ? 'bg-[#556B2F]/15 text-[#556B2F]' : 'bg-[#B85C38]/15 text-[#B85C38]'}`}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-[#2D2620] mb-1">{item.name}</h3>
                    <p className="text-xs text-[#666057] font-medium">{item.farm}</p>
                    <div className="mt-3 pt-3 border-t border-[#E6E1D5]/60 flex items-center justify-between text-xs">
                      <span className="text-[#666057]">Qty: <strong className="text-[#2D2620]">{item.qty}</strong></span>
                      <span className="font-extrabold text-[#556B2F]">{item.price}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onSelectTab && onSelectTab('procurement-orders')}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Initiate Procurement</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 2 CONTENT: STORAGE & WAREHOUSE        */}
      {/* ========================================== */}
      {activeStep === 'storage-warehouse' && (
        <div className="space-y-6 animate-fade-in">
          {/* All 4 Warehouse Cards */}
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
      )}

      {/* ========================================== */}
      {/* STEP 3 CONTENT: LOGISTICS CENTRAL INVENTORY */}
      {/* ========================================== */}
      {activeStep === 'logistics-orders' && (
        <div className="space-y-6 animate-fade-in">
          {/* Warehouse Category Allocations Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D5] shadow-xs space-y-6">
            <h3 className="text-lg sm:text-xl font-extrabold text-[#2D2620]">Warehouse Category Allocations</h3>
            {categoryAllocations.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F0] rounded-2xl border border-[#E6E1D5] flex flex-col items-center justify-center">
                <Building2 className="w-8 h-8 text-[#8C8275] mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-[#2D2620]">No Category Allocations in Storage</h4>
                <p className="text-xs text-[#666057] mt-1 max-w-sm">
                  Produce batches accepted into logistics warehouses will be dynamically aggregated and catalogued here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {categoryAllocations.map((c, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-extrabold text-[#2D2620]">{c.name}</span>
                      <div className="flex items-center gap-3 sm:gap-6">
                        <span className="text-[#666057] font-medium">{c.qty} ({c.val})</span>
                        <span className="font-extrabold text-[#556B2F] w-10 text-right">{c.pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#FAF7F0] h-3.5 rounded-full overflow-hidden border border-[#E6E1D5]/60">
                      <div className="bg-[#556B2F] h-full rounded-full transition-all duration-500" style={{ width: `${c.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
