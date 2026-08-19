import React from 'react';
import { ArrowLeft, Plus, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { inventoryItems, inventorySummary } from '../../data/mockData';
import { 
  cropIllustrationsMap, 
  individualCropIllustrationsMap, 
  FruitsIllustration 
} from '../components/CropIllustrations';

export const InventoryView = ({ onBack, onAddItem, onSelectItem }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E6E1D5] shadow-xs w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[#3B3028]">
            Inventory
          </h1>
        </div>

        <button className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5]">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Dark Olive Banner */}
      <div className="bg-[#3D4E2A] text-white rounded-2xl p-5 sm:p-6 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#C2CBAD] uppercase tracking-wider block">
            Total Inventory
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {inventorySummary.totalVolume}
            </span>
            <span className="text-xs font-bold text-[#C2CBAD]">
              {inventorySummary.volumeUnit}
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-[#7A8B52]/40"></div>

        <div className="text-right">
          <span className="text-xs font-semibold text-[#C2CBAD] uppercase tracking-wider block">
            Total Value
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
            {inventorySummary.totalValue}
          </span>
        </div>
      </div>

      {/* Inventory List Header */}
      <div className="flex items-center justify-between px-1 mt-1">
        <h2 className="text-base font-extrabold text-[#3B3028]">
          Inventory List
        </h2>
        <span className="text-xs font-bold text-[#786E65]">
          {inventoryItems.length} Items Recorded
        </span>
      </div>

      {/* Inventory Items Stack with Warm Cream Card Backgrounds */}
      <div className="flex flex-col gap-3.5 w-full">
        {inventoryItems.map((item) => {
          const Illustration = individualCropIllustrationsMap[item.name] || cropIllustrationsMap[item.categoryId] || FruitsIllustration;
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              style={{ backgroundColor: '#FAF7F0' }}
              className="border border-[#E8E2D5] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 group w-full"
            >
              {/* Left Image & Details */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                  <Illustration className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#3B3028] leading-tight">
                    {item.name}
                  </h3>
                  <span className="text-xs sm:text-sm font-bold text-[#786E65] mt-0.5 block">
                    {item.quantity}
                  </span>
                </div>
              </div>

              {/* Right Value & Chevron */}
              <div className="flex items-center gap-3">
                <span className="text-sm sm:text-base font-extrabold text-[#3B3028]">
                  {item.value}
                </span>
                <ChevronRight className="w-5 h-5 text-[#3B3028] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Stock Action Button */}
      <button 
        onClick={onAddItem}
        className="w-full py-4 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] mt-2"
      >
        <Plus className="w-5 h-5" />
        Add New Stock
      </button>
    </div>
  );
};
