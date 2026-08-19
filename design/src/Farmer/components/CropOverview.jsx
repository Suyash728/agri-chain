import React from 'react';
import { 
  FruitsIllustration, 
  VegetablesIllustration, 
  GrainsIllustration, 
  PulsesIllustration, 
  SpicesIllustration, 
  DryFruitsIllustration 
} from './CropIllustrations';

export const cropIllustrationsMap = {
  fruits: FruitsIllustration,
  vegetables: VegetablesIllustration,
  grains: GrainsIllustration,
  pulses: PulsesIllustration,
  spices: SpicesIllustration,
  dryfruits: DryFruitsIllustration,
};

export const CropOverview = ({ categories, onSelectCategory, onViewAll }) => {
  return (
    <div className="bg-white border border-[#E6E1D5] rounded-2xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base sm:text-lg font-extrabold text-[#3B3028]">
          My Crops Overview
        </h2>
        <button 
          onClick={onViewAll}
          className="text-xs sm:text-sm font-bold text-[#556B2F] hover:text-[#3D4E2A] transition-colors"
        >
          View All
        </button>
      </div>

      {/* Grid of 6 Crop Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {categories.map((cat) => {
          const Illustration = cropIllustrationsMap[cat.id] || FruitsIllustration;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              style={{ backgroundColor: '#FAF7F0' }}
              className="border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 group"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Illustration className="w-full h-full object-contain" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#3B3028] leading-tight">
                {cat.name}
              </h3>
              <span className="text-xs font-semibold text-[#7A8B52] mt-0.5">
                {cat.countLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
