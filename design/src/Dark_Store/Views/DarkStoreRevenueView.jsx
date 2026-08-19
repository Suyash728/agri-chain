import React, { useState } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Filter, 
  X,
  CreditCard,
  Building2,
  PieChart
} from 'lucide-react';

export const DarkStoreRevenueView = ({ onBack }) => {
  const [selectedDateRange, setSelectedDateRange] = useState('01 May, 2025 - 12 May, 2025');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [activeStore, setActiveStore] = useState('Nashik Central Store');
  const [currentPage, setCurrentPage] = useState(1);

  // Revenue Summary Table Dataset (12 Days for pagination)
  const revenueTableData = [
    { date: '12 May, 2025', orders: 48, grossRev: '26,450', discount: '1,250', netRev: '25,200', profit: '7,560', margin: '30.0%' },
    { date: '11 May, 2025', orders: 62, grossRev: '31,850', discount: '1,500', netRev: '30,350', profit: '9,410', margin: '31.0%' },
    { date: '10 May, 2025', orders: 70, grossRev: '35,620', discount: '1,800', netRev: '33,820', profit: '10,820', margin: '32.0%' },
    { date: '09 May, 2025', orders: 55, grossRev: '27,430', discount: '1,300', netRev: '26,130', profit: '8,120', margin: '31.1%' },
    { date: '08 May, 2025', orders: 47, grossRev: '22,980', discount: '1,100', netRev: '21,880', profit: '6,710', margin: '30.6%' },
    { date: '07 May, 2025', orders: 52, grossRev: '25,100', discount: '1,200', netRev: '23,900', profit: '7,350', margin: '30.8%' },
    { date: '06 May, 2025', orders: 58, grossRev: '28,400', discount: '1,400', netRev: '27,000', profit: '8,370', margin: '31.0%' },
    { date: '05 May, 2025', orders: 76, grossRev: '39,200', discount: '1,900', netRev: '37,300', profit: '11,900', margin: '31.9%' },
    { date: '04 May, 2025', orders: 60, grossRev: '29,800', discount: '1,450', netRev: '28,350', profit: '8,780', margin: '31.0%' },
    { date: '03 May, 2025', orders: 64, grossRev: '31,200', discount: '1,500', netRev: '29,700', profit: '9,200', margin: '31.0%' },
    { date: '02 May, 2025', orders: 54, grossRev: '26,800', discount: '1,300', netRev: '25,500', profit: '7,900', margin: '31.0%' },
    { date: '01 May, 2025', orders: 50, grossRev: '24,500', discount: '1,150', netRev: '23,350', profit: '7,200', margin: '30.8%' },
  ];

  // Pagination Logic (5 rows per page)
  const pageSize = 5;
  const totalPages = Math.ceil(revenueTableData.length / pageSize);
  const paginatedData = revenueTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Revenue Over Time Vertical Bars Data
  const dailyBarData = [
    { day: '01 May', height: '48%' },
    { day: '02 May', height: '54%' },
    { day: '03 May', height: '60%' },
    { day: '04 May', height: '60%' },
    { day: '05 May', height: '78%' },
    { day: '06 May', height: '56%' },
    { day: '07 May', height: '52%' },
    { day: '08 May', height: '44%' },
    { day: '09 May', height: '60%' },
    { day: '10 May', height: '74%' },
    { day: '11 May', height: '82%' },
    { day: '12 May', height: '42%' },
  ];

  // Revenue by Source Horizontal Bars Data
  const sourceBarData = [
    { name: 'Fresh Veg Traders', val: '₹78,450', width: '78%' },
    { name: 'Green Valley Farms', val: '₹56,320', width: '56%' },
    { name: 'Daily Needs Store', val: '₹42,180', width: '42%' },
    { name: 'Dairy Connect', val: '₹38,950', width: '38%' },
    { name: 'Organic World', val: '₹24,600', width: '24%' },
    { name: 'Farm Fresh Hub', val: '₹8,250', width: '10%' },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full pt-1 pb-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">
              Revenue Analytics
            </h1>
            <p className="text-xs text-[#666057] mt-0.5 font-medium">
              Track revenue performance, category contribution & profit insights.
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Bell Notification Button */}
          <button 
            onClick={() => alert('Revenue target reached! Monthly net margin at 31.2%.')}
            className="relative p-2.5 rounded-2xl bg-white border border-[#E6E1D5] text-[#2D2620] hover:bg-[#FAF7F0] cursor-pointer shadow-xs"
          >
            <Bell className="w-4 h-4 text-[#2D2620]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#556B2F] text-white text-[10px] font-black flex items-center justify-center">
              3
            </span>
          </button>

          {/* Date Selector Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620]">
            <span>12 May, 2025</span>
            <Calendar className="w-4 h-4 text-[#666057]" />
          </div>

          {/* Store Location Dropdown */}
          <div className="relative">
            <select 
              value={activeStore}
              onChange={(e) => setActiveStore(e.target.value)}
              className="appearance-none bg-white border border-[#E6E1D5] rounded-2xl px-4 py-2 pr-8 text-xs font-bold text-[#2D2620] cursor-pointer focus:outline-none shadow-xs hover:border-[#354424] transition-colors"
            >
              <option value="Nashik Central Store">Store: Nashik Central Store</option>
              <option value="Pune Dark Store #04">Store: Pune Dark Store #04</option>
              <option value="Mumbai Micro Hub #12">Store: Mumbai Micro Hub #12</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#666057] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>



      {/* ========================================== */}
      {/* ROW 1: KPI CARDS & REVENUE OVER TIME CHART */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 w-full items-stretch">
        
        {/* Left Card 1: Total Revenue */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between h-[165px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#2D2620]">Total Revenue</span>
            <div className="w-8 h-8 rounded-full bg-[#EBF3E8] border border-[#D4E4CE] flex items-center justify-center text-[#556B2F] flex-shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="my-auto">
            <div className="text-2xl sm:text-[26px] font-extrabold text-[#1A1A1A] tracking-tight">
              ₹2,48,750
            </div>
          </div>

          <p className="text-[10px] font-bold text-[#354424] flex items-center gap-1 leading-tight">
            <span>↑ 18.6%</span>
            <span className="text-[#666057] font-medium">vs 01 Apr – 30 Apr, 2025</span>
          </p>
        </div>

        {/* Center Card 2: Revenue Over Time (Vertical Bar Chart) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between h-[165px]">
          <h2 className="text-xs font-extrabold text-[#2D2620]">Revenue Over Time</h2>

          {/* Bar Chart Grid */}
          <div className="h-24 w-full relative pt-1 my-auto">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 bottom-5 w-7 flex flex-col justify-between text-[9px] font-semibold text-[#8C8275] text-right pr-1">
              <span>80K</span>
              <span>60K</span>
              <span>40K</span>
              <span>20K</span>
              <span>0</span>
            </div>

            {/* Bars Area */}
            <div className="ml-7 h-20 border-b border-[#E6E1D5]/70 flex items-end justify-between px-1 gap-1 sm:gap-1.5">
              {dailyBarData.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer">
                  <div 
                    style={{ height: bar.height }}
                    className="w-full max-w-[14px] sm:max-w-[16px] bg-[#4F6D38] rounded-t-sm hover:bg-[#354424] transition-all group-hover:scale-y-105"
                    title={`${bar.day}: ${bar.height}`}
                  />
                  <span className="text-[8px] sm:text-[9px] font-medium text-[#8C8275] truncate w-full text-center">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Chart Legend */}
          <div className="flex items-center justify-center gap-1.5 text-[9px] font-extrabold text-[#666057]">
            <span className="w-2.5 h-2.5 bg-[#4F6D38] rounded-xs"></span>
            <span>Revenue (₹)</span>
          </div>
        </div>

        {/* Right Card 3: Average Order Value */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between h-[165px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#2D2620]">Average Order Value</span>
            <div className="w-8 h-8 rounded-full bg-[#EBF3E8] border border-[#D4E4CE] flex items-center justify-center text-[#556B2F] flex-shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="my-auto">
            <div className="text-2xl sm:text-[26px] font-extrabold text-[#1A1A1A] tracking-tight">
              ₹1,256
            </div>
          </div>

          <p className="text-[10px] font-bold text-[#354424] flex items-center gap-1 leading-tight">
            <span>↑ 14.3%</span>
            <span className="text-[#666057] font-medium">vs 01 Apr – 30 Apr, 2025</span>
          </p>
        </div>

      </div>

      {/* ========================================== */}
      {/* ROW 2: 3 ANALYTICS CHARTS SIDE-BY-SIDE     */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* Chart 1: Revenue by Category */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-xs font-extrabold text-[#2D2620]">Revenue by Category</h2>

          <div className="flex items-center justify-between gap-2 py-2 my-auto">
            {/* SVG Donut Ring matching reference screenshot */}
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Vegetables 45.2% (Dark Green #3D4E2A) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#3D4E2A" strokeWidth="18" strokeDasharray="107.9 130.8" strokeDashoffset="0" />
                {/* Fruits 28.1% (Yellow #EAB308) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="18" strokeDasharray="67.0 171.7" strokeDashoffset="-107.9" />
                {/* Dairy 12.4% (Blue #4A7AA5) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#4A7AA5" strokeWidth="18" strokeDasharray="29.6 209.1" strokeDashoffset="-174.9" />
                {/* Grains 8.7% (Beige #C3D49C) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#C3D49C" strokeWidth="18" strokeDasharray="20.7 218.0" strokeDashoffset="-204.5" />
                {/* Others 5.6% (Gray #CBC7BC) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#CBC7BC" strokeWidth="18" strokeDasharray="13.3 225.4" strokeDashoffset="-225.2" />
              </svg>
            </div>

            {/* Legend List */}
            <div className="space-y-2 text-xs font-semibold flex-1 pl-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3D4E2A] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Vegetables</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">45.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Fruits</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">28.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4A7AA5] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Dairy</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">12.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C3D49C] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Grains</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">8.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBC7BC] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Others</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">5.6%</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E6E1D5]/60 text-xs font-semibold text-[#666057] flex justify-between">
            <span>Total</span>
            <span className="font-extrabold text-[#2D2620]">₹2,48,750</span>
          </div>
        </div>

        {/* Chart 2: Revenue by Source (Supplier/Farm) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <h2 className="text-xs font-extrabold text-[#2D2620]">Revenue by Source (Supplier/Farm)</h2>

          {/* Horizontal Bar Chart */}
          <div className="space-y-2.5 text-xs py-1">
            {sourceBarData.map((src, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-[#2D2620]">
                  <span className="truncate max-w-[140px]">{src.name}</span>
                  <span>{src.val}</span>
                </div>
                <div className="h-3 w-full bg-[#FAF7F0] rounded-full overflow-hidden border border-[#E6E1D5]/50">
                  <div 
                    style={{ width: src.width }}
                    className="h-full bg-[#3D4E2A] rounded-full transition-all hover:bg-[#556B2F]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* X Axis Scale & Legend */}
          <div>
            <div className="flex justify-between text-[9px] font-bold text-[#8C8275] px-1 pt-1 border-t border-[#E6E1D5]/60">
              <span>0</span>
              <span>20K</span>
              <span>40K</span>
              <span>60K</span>
              <span>80K</span>
              <span>100K</span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-extrabold text-[#666057]">
              <span className="w-2.5 h-2.5 bg-[#3D4E2A] rounded-xs"></span>
              <span>Revenue (₹)</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Revenue by Payment Mode */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-xs font-extrabold text-[#2D2620]">Revenue by Payment Mode</h2>

          <div className="flex items-center justify-between gap-2 py-2 my-auto">
            {/* SVG Donut Ring matching reference screenshot */}
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* UPI 62.3% (Dark Green #3D4E2A) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#3D4E2A" strokeWidth="18" strokeDasharray="148.7 90.0" strokeDashoffset="0" />
                {/* Card 21.8% (Yellow #EAB308) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="18" strokeDasharray="52.0 186.7" strokeDashoffset="-148.7" />
                {/* Cash 15.2% (Blue #4A7AA5) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#4A7AA5" strokeWidth="18" strokeDasharray="36.2 202.5" strokeDashoffset="-200.7" />
                {/* Other 0.7% (Gray #CBC7BC) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#CBC7BC" strokeWidth="18" strokeDasharray="1.8 236.9" strokeDashoffset="-236.9" />
              </svg>
            </div>

            {/* Legend List */}
            <div className="space-y-2 text-xs font-semibold flex-1 pl-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3D4E2A] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">UPI</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">62.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Card</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">21.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4A7AA5] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Cash</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">15.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBC7BC] flex-shrink-0"></span>
                  <span className="text-[#2D2620] font-bold">Other</span>
                </div>
                <span className="font-extrabold text-[#2D2620]">0.7%</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E6E1D5]/60 text-xs font-semibold text-[#666057] flex justify-between">
            <span>Total</span>
            <span className="font-extrabold text-[#2D2620]">₹2,48,750</span>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* ROW 3: REVENUE SUMMARY DATA TABLE          */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-xs overflow-hidden w-full space-y-1">
        <div className="p-4 sm:p-5 border-b border-[#E6E1D5]">
          <h2 className="text-base font-extrabold text-[#2D2620]">Revenue Summary</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F0]/60 border-b border-[#E6E1D5] text-[11px] font-extrabold text-[#666057] uppercase tracking-wider">
                <th className="py-3.5 px-5">DATE</th>
                <th className="py-3.5 px-5">TOTAL ORDERS</th>
                <th className="py-3.5 px-5">TOTAL REVENUE (₹)</th>
                <th className="py-3.5 px-5">DISCOUNT (₹)</th>
                <th className="py-3.5 px-5">NET REVENUE (₹)</th>
                <th className="py-3.5 px-5">GROSS PROFIT (₹)</th>
                <th className="py-3.5 px-5">PROFIT MARGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D5]/70 text-xs font-semibold text-[#2D2620]">
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FAF7F0]/50 transition-colors">
                  <td className="py-4 px-5 font-extrabold text-[#2D2620]">{row.date}</td>
                  <td className="py-4 px-5 text-[#2D2620]">{row.orders}</td>
                  <td className="py-4 px-5 font-bold text-[#2D2620]">{row.grossRev}</td>
                  <td className="py-4 px-5 text-[#666057]">{row.discount}</td>
                  <td className="py-4 px-5 font-bold text-[#2D2620]">{row.netRev}</td>
                  <td className="py-4 px-5 font-extrabold text-[#354424]">{row.profit}</td>
                  <td className="py-4 px-5 font-extrabold text-[#354424]">{row.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="p-4 sm:p-5 border-t border-[#E6E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-[#666057]">
          <span>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, revenueTableData.length)} of {revenueTableData.length} days</span>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="w-8 h-8 rounded-xl border border-[#E6E1D5] flex items-center justify-center hover:bg-[#FAF7F0] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#2D2620]" />
            </button>

            {[1, 2, 3].map((page) => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center cursor-pointer transition-colors ${
                  currentPage === page 
                    ? 'bg-[#3D4E2A] text-white shadow-xs' 
                    : 'border border-[#E6E1D5] hover:bg-[#FAF7F0] text-[#2D2620]'
                }`}
              >
                {page}
              </button>
            ))}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="w-8 h-8 rounded-xl border border-[#E6E1D5] flex items-center justify-center hover:bg-[#FAF7F0] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-[#2D2620]" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
