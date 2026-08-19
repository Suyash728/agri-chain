import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { 
  FruitsIllustration, 
  VegetablesIllustration, 
  GrainsIllustration, 
  PulsesIllustration, 
  SpicesIllustration, 
  DryFruitsIllustration,
  TomatoIllustration,
  PotatoIllustration,
  individualCropIllustrationsMap
} from '../components/CropIllustrations';

export const CropDetailsView = ({ category, onBack }) => {
  const cat = category || {
    name: "Vegetables",
    id: "vegetables",
    totalInventory: "1.20 Tonnes",
    totalValue: "₹4,800",
    crops: [
      { name: "Tomato", quantity: "0.60 Tonnes", value: "₹2,400", status: "In Stock" },
      { name: "Potato", quantity: "0.60 Tonnes", value: "₹2,400", status: "In Stock" }
    ]
  };

  const getCropIcon = (name) => {
    const SpecificIcon = individualCropIllustrationsMap[name];
    if (SpecificIcon) return <SpecificIcon className="w-14 h-14 sm:w-16 sm:h-16" />;

    if (name.includes('Tomato')) return <TomatoIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (name.includes('Potato')) return <PotatoIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (name.includes('Wheat') || name.includes('Rice')) return <GrainsIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (name.includes('Chickpea') || name.includes('Gram')) return <PulsesIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    if (name.includes('Chilli') || name.includes('Turmeric')) return <SpicesIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
    return <DryFruitsIllustration className="w-14 h-14 sm:w-16 sm:h-16" />;
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E6E1D5] shadow-xs w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#3B3028]">
            {cat.name}
          </h1>
        </div>

        <button className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5]">
          <Search className="w-4 h-4 text-[#556B2F]" />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-4 sm:p-5 flex justify-between items-center shadow-xs">
        <div className="text-center flex-1 border-r border-[#E6E1D5] pr-2">
          <span className="text-xs font-semibold text-[#786E65] block">Total Crops</span>
          <span className="text-lg font-extrabold text-[#3B3028]">{cat.crops ? cat.crops.length : 2}</span>
        </div>
        <div className="text-center flex-1 border-r border-[#E6E1D5] px-2">
          <span className="text-xs font-semibold text-[#786E65] block">Total Inventory</span>
          <span className="text-base sm:text-lg font-extrabold text-[#3B3028]">{cat.totalInventory}</span>
        </div>
        <div className="text-center flex-1 pl-2">
          <span className="text-xs font-semibold text-[#786E65] block">Total Value</span>
          <span className="text-base sm:text-lg font-extrabold text-[#3D4E2A]">{cat.totalValue}</span>
        </div>
      </div>

      {/* Crop List Cards with Warm Cream Background & Direct Isolated Artwork */}
      <div className="flex flex-col gap-3.5 w-full">
        {cat.crops && cat.crops.map((crop, index) => (
          <div 
            key={index} 
            style={{ backgroundColor: '#FAF7F0' }}
            className="border border-[#E8E2D5] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 w-full"
          >
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center justify-center flex-shrink-0">
                {getCropIcon(crop.name)}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#3B3028] leading-tight">
                  {crop.name}
                </h3>
                <span className="text-xs sm:text-sm font-semibold text-[#786E65] block mt-0.5">
                  {crop.quantity}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-[#3D4E2A] mt-0.5 block">
                  {crop.value}
                </span>
              </div>
            </div>

            <span className="badge-confirmed text-xs font-bold px-3 py-1 rounded-full">
              {crop.status || 'In Stock'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
