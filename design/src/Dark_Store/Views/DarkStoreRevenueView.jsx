import React, { useState, useEffect } from 'react';
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

export const DarkStoreRevenueView = ({ onBack, onOpenNotifications }) => {
  const currentDateFormatted = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const [selectedDateRange, setSelectedDateRange] = useState(`${currentDateFormatted}`);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [activeStore, setActiveStore] = useState('Nashik Central Store');
  const [currentPage, setCurrentPage] = useState(1);
  const [liveKpis, setLiveKpis] = useState(null);
  const [revenueData, setRevenueData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/darkstore/kpis')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLiveKpis(data);
      })
      .catch(() => {});

    fetch('http://localhost:8000/darkstore/revenue')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setRevenueData(data);
      })
      .catch(() => {});
  }, []);

  // Revenue Summary Table Dataset from live API
  const revenueTableData = revenueData?.revenueTableData || [];

  // Pagination Logic (5 rows per page)
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(revenueTableData.length / pageSize));
  const paginatedData = revenueTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Revenue Over Time Vertical Bars Data
  const dailyBarData = revenueData?.dailyBarData && revenueData.dailyBarData.length > 0
    ? revenueData.dailyBarData
    : [
        { day: 'D-1', height: '30%' },
        { day: 'Today', height: '70%' },
      ];

  // Revenue by Source Horizontal Bars Data
  const sourceBarData = revenueData?.sourceBarData && revenueData.sourceBarData.length > 0
    ? revenueData.sourceBarData
    : [
        { name: 'Direct Farm Hub', val: revenueData?.totalRevenue || '₹ 0', width: '80%' },
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
            onClick={onOpenNotifications || (() => alert('Revenue target reached! Monthly net margin at 31.2%.'))}
            className="relative p-2.5 rounded-2xl bg-white border border-[#E6E1D5] text-[#2D2620] hover:bg-[#FAF7F0] cursor-pointer shadow-xs"
          >
            <Bell className="w-4 h-4 text-[#2D2620]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#556B2F] text-white text-[10px] font-black flex items-center justify-center">
              3
            </span>
          </button>

          {/* Date Selector Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620]">
            <span>{currentDateFormatted}</span>
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
              {revenueData?.totalRevenue || liveKpis?.revenueThisMonth || '₹ 0'}
            </div>
          </div>

          <p className="text-[10px] font-bold text-[#354424] flex items-center gap-1 leading-tight">
            <span>↑ Verified</span>
            <span className="text-[#666057] font-medium">from settled consumer checkouts</span>
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
              {revenueData?.avgOrderValue || '₹ 0'}
            </div>
          </div>

          <p className="text-[10px] font-bold text-[#354424] flex items-center gap-1 leading-tight">
            <span>↑ {revenueData?.totalOrders || 0} orders</span>
            <span className="text-[#666057] font-medium">completed</span>
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
            <span className="font-extrabold text-[#2D2620]">{liveKpis?.revenueThisMonth || '₹2,48,750'}</span>
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
            <span className="font-extrabold text-[#2D2620]">{liveKpis?.revenueThisMonth || '₹2,48,750'}</span>
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-sm text-[#666057]">
                    No revenue settlement records found for this period.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F0]/50 transition-colors">
                    <td className="py-4 px-5 font-extrabold text-[#2D2620]">{row.date}</td>
                    <td className="py-4 px-5 text-[#2D2620]">{row.orders}</td>
                    <td className="py-4 px-5 font-bold text-[#2D2620]">{row.grossRev}</td>
                    <td className="py-4 px-5 text-[#666057]">{row.discount}</td>
                    <td className="py-4 px-5 font-bold text-[#2D2620]">{row.netRev}</td>
                    <td className="py-4 px-5 font-extrabold text-[#354424]">{row.profit}</td>
                    <td className="py-4 px-5 font-extrabold text-[#354424]">{row.margin}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="p-4 sm:p-5 border-t border-[#E6E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-[#666057]">
          <span>Showing {revenueTableData.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, revenueTableData.length)} of {revenueTableData.length} days</span>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="w-8 h-8 rounded-xl border border-[#E6E1D5] flex items-center justify-center hover:bg-[#FAF7F0] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#2D2620]" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
