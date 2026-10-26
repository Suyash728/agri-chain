import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { 
  FruitsIllustration, 
  VegetablesIllustration, 
  GrainsIllustration, 
  PulsesIllustration, 
  SpicesIllustration, 
  DryFruitsIllustration,
  MangoIllustration,
  BananaIllustration,
  TomatoIllustration,
  PotatoIllustration,
  WheatIllustration,
  RiceIllustration,
  ChickpeaIllustration,
  GreenGramIllustration,
  ChilliIllustration,
  TurmericIllustration,
  CashewIllustration,
  AlmondIllustration,
  individualCropIllustrationsMap
} from '../components/CropIllustrations';

export const CropDetailsView = ({ category, onBack, onSelectCrop }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState(category || null);

  useEffect(() => {
    if (category && category.crops && category.crops.length > 0) {
      setActiveCategory(category);
      return;
    }

    // Auto-fetch categories if category prop is missing or empty
    const targetId = category?.id || (typeof window !== 'undefined' ? localStorage.getItem('agrichain_farmer_crop_category') : null) || 'fruits';
    fetch('http://localhost:8000/farmer/crops')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const match = data.find(c => c.id === targetId || c.name?.toLowerCase() === targetId?.toLowerCase()) || data[0];
          if (match) setActiveCategory(match);
        }
      })
      .catch(err => console.debug('Failed to load crop category details:', err));
  }, [category]);

  const cat = activeCategory || category || {
    name: "Fruits",
    id: "fruits",
    totalInventory: "0.00 Tonnes",
    totalValue: "₹0",
    crops: []
  };

  const getCropIcon = (name = '') => {
    const SpecificIcon = individualCropIllustrationsMap[name];
    if (SpecificIcon) return <SpecificIcon className="w-14 h-14 sm:w-16 sm:h-16" />;

    const lower = name.toLowerCase();
    if (lower.includes('mango')) return <MangoIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('banana')) return <BananaIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('orange') || lower.includes('apple') || lower.includes('strawberr') || lower.includes('fruit')) {
      return <FruitsIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    }
    if (lower.includes('tomato')) return <TomatoIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('potato')) return <PotatoIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('spinach') || lower.includes('capsicum') || lower.includes('vegetable')) {
      return <VegetablesIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    }
    if (lower.includes('wheat')) return <WheatIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('rice') || lower.includes('grain')) return <RiceIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('chickpea')) return <ChickpeaIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('moong') || lower.includes('gram') || lower.includes('dal') || lower.includes('toor') || lower.includes('pulse')) {
      return <GreenGramIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    }
    if (lower.includes('chilli')) return <ChilliIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('turmeric') || lower.includes('spice')) return <TurmericIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('cashew')) return <CashewIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (lower.includes('almond')) return <AlmondIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    return <DryFruitsIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
  };

  const filteredCrops = (cat.crops || []).filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.batch_id && c.batch_id.toLowerCase().includes(q)) ||
      (c.quality && c.quality.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E6E1D5] shadow-xs w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#3B3028]">
            {cat.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search crops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="pl-8 pr-7 py-1.5 text-xs rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#556B2F] w-40 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-[#556B2F] absolute left-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowSearch(true)}
              className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5] cursor-pointer"
              title="Filter crops"
            >
              <Search className="w-4 h-4 text-[#556B2F]" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-xs">
        <div className="text-center flex-1 border-r border-[#E6E1D5] pr-2">
          <span className="text-xs font-semibold text-[#786E65] block">Total Crops</span>
          <span className="text-lg font-extrabold text-[#3B3028]">{cat.crops ? cat.crops.length : 0}</span>
        </div>
        <div className="text-center flex-1 border-r border-[#E6E1D5] px-2">
          <span className="text-xs font-semibold text-[#786E65] block">Total Inventory</span>
          <span className="text-base sm:text-lg font-extrabold text-[#3B3028]">{cat.totalInventory || '0.00 Tonnes'}</span>
        </div>
        <div className="text-center flex-1 pl-2">
          <span className="text-xs font-semibold text-[#786E65] block">Total Value</span>
          <span className="text-base sm:text-lg font-extrabold text-[#3D4E2A]">{cat.totalValue || '₹0'}</span>
        </div>
      </div>

      {/* Crop List Cards with Warm Cream Background & Direct Isolated Artwork */}
      <div className="flex flex-col gap-3.5 w-full">
        {filteredCrops.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E6E1D5] text-sm text-[#666057] font-semibold">
            No crops registered in this category yet.
          </div>
        ) : (
          filteredCrops.map((crop, index) => (
            <div 
              key={crop.batch_id || index} 
              onClick={() => onSelectCrop && onSelectCrop(crop)}
              style={{ backgroundColor: '#FAF7F0' }}
              className="border border-[#E8E2D5] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 w-full"
            >
              <div className="flex items-center gap-4 sm:gap-6 min-w-0 pr-2">
                <div className="flex items-center justify-center flex-shrink-0">
                  {getCropIcon(crop.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#3B3028] leading-tight truncate">
                    {crop.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-[#786E65]">
                      {crop.quantity}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#3D4E2A]">
                      • {crop.value}
                    </span>
                  </div>
                  {crop.batch_id && (
                    <span className="text-[10px] font-mono text-[#8C827A] block mt-0.5 truncate">
                      Batch #{crop.batch_id}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                <span className="badge-confirmed text-xs font-bold px-3 py-1 rounded-full">
                  {crop.status || 'In Stock'}
                </span>
                <span className="bg-[#EBF3E8] text-[#556B2F] border border-[#C2E0B8] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ✓ IPFS Anchored
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
