import React, { useState } from 'react';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
import { cropCategories } from '../../data/mockData';
import { cropIllustrationsMap, FruitsIllustration } from '../components/CropIllustrations';

export const MyCropsView = ({ onBack, onSelectCategory, onSearchClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = cropCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 w-full relative select-none">
      {/* Header Bar - Full Width matching Inventory */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E6E1D5] shadow-xs w-full relative z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[#3B3028]">
            My Crops
          </h1>
        </div>

        <div className="relative w-48 sm:w-64">
          <Search className="w-4 h-4 text-[#7A8B52] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-full text-xs font-semibold text-[#3B3028] focus:outline-none focus:border-[#7A8B52]"
          />
        </div>
      </div>

      {/* Single Column Vertical Stack List matching reference image */}
      <div className="flex flex-col gap-3.5 w-full relative z-10">
        {filteredCategories.map((cat) => {
          const Illustration = cropIllustrationsMap[cat.id] || FruitsIllustration;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              style={{ backgroundColor: '#FAF7F0' }}
              className="border border-[#E8E2D5] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 group w-full"
            >
              {/* Left Image & Text */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0 pointer-events-none select-none">
                  <Illustration className="w-full h-full object-contain pointer-events-none select-none" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#3B3028] leading-tight">
                    {cat.name}
                  </h3>
                  <span className="text-xs sm:text-sm font-bold text-[#7A8B52] mt-1 block">
                    {cat.countLabel}
                  </span>
                </div>
              </div>

              {/* Right Chevron */}
              <ChevronRight className="w-5 h-5 text-[#3B3028] group-hover:translate-x-1 transition-transform" />
            </div>
          );
        })}
      </div>

      {/* Feathered Plant Sprout Image - Completely Un-selectable & Non-draggable */}
      <div className="flex justify-center mt-3 pointer-events-none select-none z-10">
        <img 
          src="/images/plant_sprout_cleaned.png" 
          alt="Agricultural Plant Sprout" 
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          className="w-32 h-32 sm:w-44 sm:h-44 object-contain mix-blend-multiply opacity-95 pointer-events-none select-none user-select-none"
        />
      </div>
    </div>
  );
};
