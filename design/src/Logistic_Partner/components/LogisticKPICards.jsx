import React from 'react';

export const LogisticKPICards = ({ onCardClick }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Card 1: Total Shipments */}
      <div 
        onClick={() => onCardClick && onCardClick('transportation')}
        style={{ backgroundColor: '#F4F5E6' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#E2E5D4]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            Total Shipments
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
              24
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#556B2F] mt-0.5 block">
            In Transit
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <img 
            src="/images/logistics_truck_kpi.png" 
            alt="Total Shipments" 
            className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-xs" 
          />
        </div>
      </div>

      {/* Card 2: Pending Orders */}
      <div 
        onClick={() => onCardClick && onCardClick('procurement-orders')}
        style={{ backgroundColor: '#FDF3E7' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#F4E2CF]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            Pending Orders
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
              8
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#B85C38] mt-0.5 block">
            To Be Procured
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <img 
            src="/images/procurement_kpi.png" 
            alt="Pending Orders" 
            className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-xs" 
          />
        </div>
      </div>

      {/* Card 3: On Time Delivery */}
      <div 
        onClick={() => onCardClick && onCardClick('shipment-tracking')}
        style={{ backgroundColor: '#EBF3FA' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#D6E3F2]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            On Time Delivery
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] tracking-tight">
              92%
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#2B6CB0] mt-0.5 block">
            This Month
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <img 
            src="/images/clock_kpi.png" 
            alt="On Time Delivery" 
            className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-xs" 
          />
        </div>
      </div>

      {/* Card 4: Total Logistics Cost */}
      <div 
        onClick={() => onCardClick && onCardClick('transactions')}
        style={{ backgroundColor: '#F4EEF8' }}
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200 border border-[#E4D7EC]"
      >
        <div className="flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-semibold text-[#3B3028] block mb-1">
            Total Logistics Cost
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-[#2D2620] tracking-tight">
              ₹ 45,680
            </span>
          </div>
          <span className="text-xs font-bold text-[#556B2F] mt-0.5 flex items-center gap-0.5">
            ↓ 8% <span className="font-semibold text-[#666057]">from last month</span>
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center pl-2">
          <img 
            src="/images/wallet_kpi.png" 
            alt="Total Logistics Cost" 
            className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-xs" 
          />
        </div>
      </div>
    </div>
  );
};
