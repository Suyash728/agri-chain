import React, { useState } from 'react';
import { 
  Package, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Thermometer, 
  Building2 
} from 'lucide-react';

export const InventoryView = ({ initialStep = 'available-produce' }) => {
  // Step state: 'available-produce' (default) | 'storage-warehouse' | 'logistics-orders'
  const [activeStep, setActiveStep] = useState(initialStep);

  // Available Produce section state & data
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const produceItems = [
    { id: 1, name: 'Premium Basmati Wheat', category: 'Grains', qty: '500 Tonnes', price: '₹2,100 / Quintal', farm: 'Patil Organic Farm, Nashik', status: 'In Stock', icon: '/images/wheat_only.png' },
    { id: 2, name: 'Basmati Long Grain Rice', category: 'Grains', qty: '300 Tonnes', price: '₹2,800 / Quintal', farm: 'Godavari Delta Fields', status: 'In Stock', icon: '/images/rice_only.png' },
    { id: 3, name: 'Fresh Organic Tomatoes', category: 'Vegetables', qty: '200 Tonnes', price: '₹1,200 / Quintal', farm: 'Sahyadri Agri Hub, Pune', status: 'Limited', icon: '/images/tomato_only.png' },
    { id: 4, name: 'Cold-Stored Potatoes', category: 'Vegetables', qty: '400 Tonnes', price: '₹1,000 / Quintal', farm: 'Satara Valley Orchards', status: 'In Stock', icon: '/images/potato_only.png' },
    { id: 5, name: 'Red Nashik Onions', category: 'Vegetables', qty: '250 Tonnes', price: '₹900 / Quintal', farm: 'Nashik Mandi Direct', status: 'In Stock', icon: '/images/potato_only.png' },
    { id: 6, name: 'Organic Chickpeas (Garbanzo)', category: 'Pulses', qty: '180 Tonnes', price: '₹4,500 / Quintal', farm: 'Malwa Agriculture Cooperative', status: 'In Stock', icon: '/images/chickpea_only.png' },
    { id: 7, name: 'Green Gram (Moong Dal)', category: 'Pulses', qty: '150 Tonnes', price: '₹5,200 / Quintal', farm: 'Vidarbha Farmer Producer Co.', status: 'In Stock', icon: '/images/greengram_only.png' },
    { id: 8, name: 'Guntur Red Chillies', category: 'Spices', qty: '80 Tonnes', price: '₹12,000 / Quintal', farm: 'Deccan Spice Estate', status: 'In Stock', icon: '/images/chilli_only.png' },
  ];

  // Storage & Warehouse Infrastructure Data
  const warehouses = [
    { name: 'Nashik Warehouse Hub', capacity: '3,000 Tonnes', utilized: '2,400 Tonnes', pct: 80, temp: '18°C (Ambient Grain Silo)', location: 'MIDC Ambad, Nashik' },
    { name: 'Pune Cold Storage Facility', capacity: '2,500 Tonnes', utilized: '1,500 Tonnes', pct: 60, temp: '4°C (Cold-Chain Reefer)', location: 'Chakan Industrial Area, Pune' },
    { name: 'Nagpur Warehouse Hub', capacity: '2,000 Tonnes', utilized: '1,500 Tonnes', pct: 75, temp: '20°C (Dry Storage)', location: 'Kalamna Market, Nagpur' },
    { name: 'Raipur Central Warehouse', capacity: '2,500 Tonnes', utilized: '1,000 Tonnes', pct: 40, temp: '16°C (Controlled Humidity)', location: 'Tatibandh, Raipur' },
  ];

  // Logistics Central Inventory Category Allocations Data (Step 3)
  const categoryAllocations = [
    { name: 'Grains (Wheat & Rice)', qty: '3,200 Tonnes', val: '₹67,200', pct: 40 },
    { name: 'Pulses & Legumes (Chickpea, Moong)', qty: '2,100 Tonnes', val: '₹38,500', pct: 27 },
    { name: 'Fruits & Vegetables (Tomato, Potato)', qty: '1,500 Tonnes', val: '₹15,000', pct: 19 },
    { name: 'Spices (Chilli, Turmeric)', qty: '550 Tonnes', val: '₹4,900', pct: 7 },
    { name: 'Dry Fruits & Nuts (Cashew, Almond)', qty: '500 Tonnes', val: '₹8,000', pct: 7 },
  ];

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
            {filteredProduce.map(item => (
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
                  onClick={() => alert(`Procurement request initiated for ${item.name}`)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
                >
                  <span>Initiate Procurement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
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
            {warehouses.map((wh, idx) => (
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
            ))}
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
          </div>
        </div>
      )}

    </div>
  );
};
