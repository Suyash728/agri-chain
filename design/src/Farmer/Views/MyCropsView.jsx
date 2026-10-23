import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, ChevronRight, X } from 'lucide-react';
import { cropIllustrationsMap, FruitsIllustration } from '../components/CropIllustrations';

export const MyCropsView = ({ categories, onBack, onSelectCategory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchedCategories, setFetchedCategories] = useState(null);

  const fetchCrops = () => {
    fetch('http://localhost:8000/farmer/crops')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setFetchedCategories(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCrops();
    window.addEventListener('agrichain-data-updated', fetchCrops);
    window.addEventListener('agrichain-data-reset', fetchCrops);
    return () => {
      window.removeEventListener('agrichain-data-updated', fetchCrops);
      window.removeEventListener('agrichain-data-reset', fetchCrops);
    };
  }, []);

  // Use categories from props if populated, otherwise use live fetched categories
  const list = (categories && categories.length > 0) ? categories : (fetchedCategories || []);
  const query = searchQuery.trim().toLowerCase();

  // Find all individual matching crops across all categories
  const matchingIndividualCrops = [];
  const filteredCategories = list.filter(cat => {
    if (!query) return true;

    const catMatches = 
      cat.name.toLowerCase().includes(query) || 
      cat.id.toLowerCase().includes(query);

    const matchingCrops = (cat.crops || []).filter(c =>
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.batch_id && c.batch_id.toLowerCase().includes(query)) ||
      (c.quality && c.quality.toLowerCase().includes(query)) ||
      (c.status && c.status.toLowerCase().includes(query))
    );

    matchingCrops.forEach(crop => {
      matchingIndividualCrops.push({ crop, category: cat });
    });

    return catMatches || matchingCrops.length > 0;
  });

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
            className="w-full pl-9 pr-8 py-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-full text-xs font-semibold text-[#3B3028] focus:outline-none focus:border-[#7A8B52]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#786E65] hover:text-[#3B3028] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Direct Matching Crops Results when searching */}
      {query && matchingIndividualCrops.length > 0 && (
        <div className="flex flex-col gap-2.5 p-4 bg-white rounded-2xl border border-[#E6E1D5] shadow-xs relative z-10">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D5]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#786E65]">
              Matching Produce & Batches ({matchingIndividualCrops.length})
            </span>
            <span className="text-[11px] text-[#556B2F] font-bold">
              Tap crop to open category
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {matchingIndividualCrops.map(({ crop, category }) => (
              <div
                key={crop.batch_id || crop.name}
                onClick={() => onSelectCategory(category)}
                className="bg-[#FAF7F0] border border-[#E8E2D5] hover:border-[#7A8B52] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:shadow-xs transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#E6E1D5] flex items-center justify-center flex-shrink-0 text-lg">
                    🌾
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#3B3028] group-hover:text-[#556B2F] transition-colors leading-tight">
                      {crop.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#786E65] mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-white border border-[#E6E1D5] text-[#556B2F] font-bold text-[10px]">
                        {category.name}
                      </span>
                      <span>{crop.quantity}</span>
                      <span className="font-bold text-[#3B3028]">{crop.value}</span>
                    </div>
                    {crop.batch_id && (
                      <span className="text-[9.5px] font-mono text-[#8C827A] block mt-0.5">
                        #{crop.batch_id}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#7A8B52] group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single Column Vertical Stack List matching reference image */}
      <div className="flex flex-col gap-3.5 w-full relative z-10">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E6E1D5] flex flex-col items-center justify-center gap-2">
            <span className="text-sm font-bold text-[#3B3028]">
              No crops or categories found matching &quot;{searchQuery}&quot;
            </span>
            <p className="text-xs text-[#786E65]">
              Try searching by crop name (e.g. Tomato, Mango), batch ID, or category.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-1 px-4 py-1.5 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] text-xs font-bold text-[#3B3028] hover:bg-[#E6E1D5] transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const Illustration = cropIllustrationsMap[cat.id] || FruitsIllustration;
            const matchingInCat = query ? (cat.crops || []).filter(c => 
              (c.name && c.name.toLowerCase().includes(query)) ||
              (c.batch_id && c.batch_id.toLowerCase().includes(query)) ||
              (c.quality && c.quality.toLowerCase().includes(query))
            ) : [];

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat)}
                style={{ backgroundColor: '#FAF7F0' }}
                className="border border-[#E8E2D5] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 group w-full"
              >
                {/* Left Image & Text */}
                <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0 pr-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0 pointer-events-none select-none">
                    <Illustration className="w-full h-full object-contain pointer-events-none select-none" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#3B3028] leading-tight truncate">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-xs sm:text-sm font-bold text-[#7A8B52]">
                        {cat.countLabel}
                      </span>
                      {matchingInCat.length > 0 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#EBF3E8] text-[#556B2F] rounded-full border border-[#C2E0B8] truncate max-w-[200px]">
                          Matches: {matchingInCat.map(c => c.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Chevron */}
                <ChevronRight className="w-5 h-5 text-[#3B3028] group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            );
          })
        )}
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
