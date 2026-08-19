import React, { useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { revenueData } from '../data/consumerData';

export const RevenueView = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-5 mt-2 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-black text-[#2D2620]">Revenue & Financial Analytics</h2>

          {/* Desktop Period Selector */}
          <div className="flex items-center gap-2 bg-white border border-[#E6E1D5] px-3 py-1.5 rounded-full text-xs font-bold text-[#2D2620] shadow-2xs cursor-pointer">
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-4 h-4 text-[#666057]" />
          </div>
        </div>

        {/* Total Revenue Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-1">
          <span className="text-xs sm:text-sm font-semibold text-[#666057]">Total Revenue</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-[#2D2620]">{revenueData.totalRevenue}</h3>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{revenueData.growth}</span>
            </span>
          </div>
        </div>

        {/* Revenue SVG Line Chart */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-3">
          <div className="h-44 sm:h-56 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#354424" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#354424" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid background lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#F4F5E6" strokeWidth="1" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#F4F5E6" strokeWidth="1" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#F4F5E6" strokeWidth="1" />

              {/* Area Fill */}
              <path 
                d="M0,75 Q50,60 100,65 T200,40 T300,20 L300,100 L0,100 Z" 
                fill="url(#revenueGrad)" 
              />
              
              {/* Line */}
              <path 
                d="M0,75 Q50,60 100,65 T200,40 T300,20" 
                fill="none" 
                stroke="#354424" 
                strokeWidth="3" 
                strokeLinecap="round"
              />

              {/* End Circle */}
              <circle cx="300" cy="20" r="4" fill="#354424" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          {/* X Axis Dates Row */}
          <div className="flex justify-between items-center text-xs font-bold text-[#666057] pt-2 border-t border-[#F4F5E6]">
            <span>1 May</span>
            <span>8 May</span>
            <span>15 May</span>
            <span>22 May</span>
            <span>31 May</span>
          </div>
        </div>

        {/* Financial Metrics: Mobile list, Desktop 4-col cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex justify-between md:flex-col md:gap-1 items-center md:items-start">
            <span className="text-xs font-semibold text-[#666057]">Total Orders</span>
            <span className="text-base sm:text-xl font-extrabold text-[#2D2620]">{revenueData.totalOrders}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex justify-between md:flex-col md:gap-1 items-center md:items-start">
            <span className="text-xs font-semibold text-[#666057]">Average Order Value</span>
            <span className="text-base sm:text-xl font-extrabold text-[#2D2620]">{revenueData.avgOrderValue}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex justify-between md:flex-col md:gap-1 items-center md:items-start">
            <span className="text-xs font-semibold text-[#666057]">Gross Profit</span>
            <span className="text-base sm:text-xl font-extrabold text-[#354424]">{revenueData.grossProfit}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex justify-between md:flex-col md:gap-1 items-center md:items-start">
            <span className="text-xs font-semibold text-[#666057]">Net Profit</span>
            <span className="text-base sm:text-xl font-extrabold text-emerald-700">{revenueData.netProfit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
