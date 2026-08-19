import React from 'react';
import { 
  SackIllustration, 
  ClipboardIllustration, 
  TruckIllustration, 
  EarningsIllustration 
} from './CropIllustrations';

export const KPICards = ({ onCardClick }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Card 1: Total Inventory (Warm Soft Sage #F4F5E6) */}
      <div 
        onClick={() => onCardClick('inventory')}
        style={{ backgroundColor: '#F4F5E6' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#E2E5D4]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            Total Inventory
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
              3.45
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#556B2F] mt-0.5 block">
            Tonnes
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <SackIllustration className="w-full h-full" />
        </div>
      </div>

      {/* Card 2: Active Orders (Warm Soft Peach #FDF3E7) */}
      <div 
        onClick={() => onCardClick('orders')}
        style={{ backgroundColor: '#FDF3E7' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#F4E2CF]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            Active Orders
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
              4
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#B85C38] mt-0.5 block">
            Orders
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <ClipboardIllustration className="w-full h-full" />
        </div>
      </div>

      {/* Card 3: Shipments (Warm Soft Ice Blue #EBF3FA) */}
      <div 
        onClick={() => onCardClick('shipments')}
        style={{ backgroundColor: '#EBF3FA' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#D6E3F2]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            Shipments
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
              2
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#2B6CB0] mt-0.5 block">
            In Transit
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <TruckIllustration className="w-full h-full" />
        </div>
      </div>

      {/* Card 4: Total Earnings (Warm Soft Lavender #F4EEF8) */}
      <div 
        onClick={() => onCardClick('earnings')}
        style={{ backgroundColor: '#F4EEF8' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#E4D7EC]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            Total Earnings
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-[#2D2620] tracking-tight">
              ₹ 28,450
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#7C3AED] mt-0.5 block">
            This Month
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <EarningsIllustration className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
