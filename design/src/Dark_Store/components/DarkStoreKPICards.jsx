import React from 'react';

export const DarkStoreKPICards = ({ onCardClick }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 w-full">
      
      {/* ========================================== */}
      {/* CARD 1: Total Inventory Value              */}
      {/* ========================================== */}
      <div 
        onClick={() => onCardClick && onCardClick('inventory')}
        className="bg-[#EFF4E9] p-3.5 rounded-2xl border border-[#D9E6D3] shadow-2xs hover:shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[104px] group"
      >
        <span className="text-[11px] font-extrabold text-[#2D2620] leading-tight block">
          Total Inventory Value
        </span>

        <div className="flex items-center justify-between gap-1 my-auto">
          <span className="text-lg sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#354424] transition-colors tracking-tight">
            ₹ 18,75,600
          </span>

          {/* Green Rupee Money Bag Icon */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <path d="M 24 16 C 24 10, 40 10, 40 16 C 44 18, 48 22, 50 28 C 54 40, 52 54, 42 58 C 32 60, 20 58, 14 48 C 10 38, 12 26, 18 18 Z" fill="#88A070" />
              <path d="M 22 18 C 22 18, 32 22, 42 18 C 40 15, 38 12, 32 12 C 26 12, 24 15, 22 18 Z" fill="#6B8454" />
              <path d="M 22 22 C 28 24, 36 24, 42 22" stroke="#4D623A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <text x="32" y="44" textAnchor="middle" fontSize="18" fontWeight="900" fill="#2E3A1F" fontFamily="sans-serif">₹</text>
            </svg>
          </div>
        </div>

        <p className="text-[10px] font-bold text-[#354424] flex items-center gap-1 leading-none">
          <span>↑ 12%</span>
          <span className="text-[#666057] font-medium">from last month</span>
        </p>
      </div>

      {/* ========================================== */}
      {/* CARD 2: Incoming Today                     */}
      {/* ========================================== */}
      <div 
        onClick={() => onCardClick && onCardClick('incoming-deliveries')}
        className="bg-[#FFF4EC] p-3.5 rounded-2xl border border-[#FDE3D2] shadow-2xs hover:shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[104px] group"
      >
        <span className="text-[11px] font-extrabold text-[#2D2620] leading-tight block">
          Incoming Today
        </span>

        <div className="flex items-center justify-between gap-1 my-auto">
          <span className="text-lg sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#B85C38] transition-colors tracking-tight">
            12
          </span>

          {/* Orange Delivery Truck Icon */}
          <div className="w-11 h-9 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 64 48" className="w-full h-full">
              <rect x="4" y="8" width="38" height="26" rx="4" fill="#F49D37" />
              <path d="M 4 8 L 42 8 L 42 34 L 4 34 Z" fill="#EE8B20" opacity="0.15" />
              <path d="M 42 16 L 54 16 Q 60 16 60 22 L 60 34 L 42 34 Z" fill="#F49D37" />
              <path d="M 46 18 L 54 18 L 54 25 L 46 25 Z" fill="#3D4E2A" opacity="0.2" />
              <circle cx="16" cy="36" r="7" fill="#3B3028" />
              <circle cx="16" cy="36" r="3" fill="#D9D4C7" />
              <circle cx="48" cy="36" r="7" fill="#3B3028" />
              <circle cx="48" cy="36" r="3" fill="#D9D4C7" />
            </svg>
          </div>
        </div>

        <p className="text-[10px] font-semibold text-[#666057] leading-none">
          Deliveries
        </p>
      </div>

      {/* ========================================== */}
      {/* CARD 3: Total Products                     */}
      {/* ========================================== */}
      <div 
        onClick={() => onCardClick && onCardClick('products')}
        className="bg-[#EEF4FB] p-3.5 rounded-2xl border border-[#DCE9FE] shadow-2xs hover:shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[104px] group"
      >
        <span className="text-[11px] font-extrabold text-[#2D2620] leading-tight block">
          Total Products
        </span>

        <div className="flex items-center justify-between gap-1 my-auto">
          <span className="text-lg sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#2563EB] transition-colors tracking-tight">
            186
          </span>

          {/* Blue 3D Shopping Bag Icon */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 54 60" className="w-full h-full">
              <path d="M 20 18 C 20 8, 34 8, 34 18" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="8" y="18" width="38" height="38" rx="6" fill="#4B8BF5" />
              <path d="M 8 18 Q 27 24 46 18 L 46 56 L 8 56 Z" fill="#2563EB" opacity="0.3" />
              <path d="M 21 24 C 23 28, 31 28, 33 24" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
            </svg>
          </div>
        </div>

        <p className="text-[10px] font-semibold text-[#666057] leading-none">
          Active SKUs
        </p>
      </div>

      {/* ========================================== */}
      {/* CARD 4: Today's Sales                      */}
      {/* ========================================== */}
      <div 
        onClick={() => onCardClick && onCardClick('sales')}
        className="bg-[#F5EEF9] p-3.5 rounded-2xl border border-[#E9D5FF] shadow-2xs hover:shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[104px] group"
      >
        <span className="text-[11px] font-extrabold text-[#2D2620] leading-tight block">
          Today's Sales
        </span>

        <div className="flex items-center justify-between gap-1 my-auto">
          <span className="text-lg sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#9333EA] transition-colors tracking-tight">
            ₹ 2,45,780
          </span>

          {/* 3D Bar Chart Icon */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 54 54" className="w-full h-full">
              <rect x="6" y="32" width="10" height="18" rx="2" fill="#B8B2A6" />
              <rect x="22" y="20" width="10" height="30" rx="2" fill="#9E9689" />
              <rect x="38" y="10" width="10" height="40" rx="2" fill="#7D7569" />
              <path d="M 6 32 L 16 32 L 16 50 L 6 50 Z" fill="white" opacity="0.2" />
              <path d="M 22 20 L 32 20 L 32 50 L 22 50 Z" fill="white" opacity="0.2" />
              <path d="M 38 10 L 48 10 L 48 50 L 38 50 Z" fill="white" opacity="0.2" />
            </svg>
          </div>
        </div>

        <p className="text-[10px] font-bold text-[#354424] flex items-center gap-1 leading-none">
          <span>↑ 9%</span>
          <span className="text-[#666057] font-medium">from yesterday</span>
        </p>
      </div>

      {/* ========================================== */}
      {/* CARD 5: Expiry Alerts                      */}
      {/* ========================================== */}
      <div 
        onClick={() => onCardClick && onCardClick('expiry-alerts')}
        className="bg-[#FFF3E6] p-3.5 rounded-2xl border border-[#FDE68A] shadow-2xs hover:shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[104px] group"
      >
        <span className="text-[11px] font-extrabold text-[#2D2620] leading-tight block">
          Expiry Alerts
        </span>

        <div className="flex items-center justify-between gap-1 my-auto">
          <span className="text-lg sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#D97706] transition-colors tracking-tight">
            7
          </span>

          {/* Warning Triangle Icon */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 54 54" className="w-full h-full">
              <path d="M 27 6 L 49 44 Q 52 49 46 49 L 8 49 Q 2 49 5 44 Z" fill="#F59E0B" />
              <path d="M 27 6 L 49 44 L 8 44 Z" fill="#FBBF24" opacity="0.3" />
              <text x="27" y="41" textAnchor="middle" fontSize="26" fontWeight="900" fill="white" fontFamily="sans-serif">!</text>
            </svg>
          </div>
        </div>

        <p className="text-[10px] font-semibold text-[#666057] leading-none">
          Items
        </p>
      </div>

      {/* ========================================== */}
      {/* CARD 6: Revenue (This Month)               */}
      {/* ========================================== */}
      <div 
        onClick={() => onCardClick && onCardClick('revenue')}
        className="bg-[#EFF4E9] p-3.5 rounded-2xl border border-[#D9E6D3] shadow-2xs hover:shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[104px] group"
      >
        <span className="text-[11px] font-extrabold text-[#2D2620] leading-tight block">
          Revenue (This Month)
        </span>

        <div className="flex items-center justify-between gap-1 my-auto">
          <span className="text-lg sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#354424] transition-colors tracking-tight">
            ₹ 11,28,450
          </span>

          {/* Green Upward Growth Graph Icon */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 54 54" className="w-full h-full">
              <circle cx="27" cy="27" r="24" fill="#88A070" opacity="0.25" />
              <path d="M 12 36 L 24 24 L 32 30 L 44 14" fill="none" stroke="#354424" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 34 14 L 44 14 L 44 24" fill="none" stroke="#354424" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <p className="text-[10px] font-bold text-[#354424] flex items-center gap-1 leading-none">
          <span>↑ 15%</span>
          <span className="text-[#666057] font-medium">from last month</span>
        </p>
      </div>

    </div>
  );
};
