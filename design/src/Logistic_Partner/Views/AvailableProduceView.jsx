import React, { useState } from 'react';
import { Search, Filter, Sprout, ArrowRight } from 'lucide-react';

export const AvailableProduceView = ({ onProcure }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const produceItems = [
    { id: 1, name: 'Premium Basmati Wheat', category: 'Grains', qty: '500 Tonnes', price: '₹ 2,100 / Quintal', farm: 'Patil Organic Farm, Nashik', status: 'In Stock', icon: '/images/wheat_only.png' },
    { id: 2, name: 'Basmati Long Grain Rice', category: 'Grains', qty: '300 Tonnes', price: '₹ 2,800 / Quintal', farm: 'Godavari Delta Fields', status: 'In Stock', icon: '/images/rice_only.png' },
    { id: 3, name: 'Fresh Organic Tomatoes', category: 'Vegetables', qty: '200 Tonnes', price: '₹ 1,200 / Quintal', farm: 'Sahyadri Agri Hub, Pune', status: 'Limited', icon: '/images/tomato_only.png' },
    { id: 4, name: 'Cold-Stored Potatoes', category: 'Vegetables', qty: '400 Tonnes', price: '₹ 1,000 / Quintal', farm: 'Satara Valley Orchards', status: 'In Stock', icon: '/images/potato_only.png' },
    { id: 5, name: 'Red Nashik Onions', category: 'Vegetables', qty: '250 Tonnes', price: '₹ 900 / Quintal', farm: 'Nashik Mandi Direct', status: 'In Stock', icon: '/images/potato_only.png' },
    { id: 6, name: 'Organic Chickpeas (Garbanzo)', category: 'Pulses', qty: '180 Tonnes', price: '₹ 4,500 / Quintal', farm: 'Malwa Agriculture Cooperative', status: 'In Stock', icon: '/images/chickpea_only.png' },
    { id: 7, name: 'Green Gram (Moong Dal)', category: 'Pulses', qty: '150 Tonnes', price: '₹ 5,200 / Quintal', farm: 'Vidarbha Farmer Producer Co.', status: 'In Stock', icon: '/images/greengram_only.png' },
    { id: 8, name: 'Guntur Red Chillies', category: 'Spices', qty: '80 Tonnes', price: '₹ 12,000 / Quintal', farm: 'Deccan Spice Estate', status: 'In Stock', icon: '/images/chilli_only.png' },
  ];

  const filtered = produceItems.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.farm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Available Produce Catalogue 🌾</h1>
          <p className="text-xs sm:text-sm text-[#666057]">Browse verified farm-gate produce ready for procurement & logistics dispatch</p>
        </div>
      </div>

      {/* Search & Filters Bar */}
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

      {/* Produce Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(item => (
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
              onClick={() => onProcure && onProcure()}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
            >
              <span>Initiate Procurement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
