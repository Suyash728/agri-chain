import React, { useState } from 'react';
import { DarkStoreHeader } from '../components/DarkStoreHeader';
import { DarkStoreKPICards } from '../components/DarkStoreKPICards';
import { 
  ChevronRight, 
  ChevronDown, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen 
} from 'lucide-react';

export const DarkStoreDashboardView = ({ onSelectTab, onOpenNotifications }) => {
  const [topProductsFilter, setTopProductsFilter] = useState('This Month');
  const [revenueFilter, setRevenueFilter] = useState('This Month');

  // Middle Card 2: Recent Incoming Deliveries Data
  const recentDeliveries = [
    {
      id: 'DLY #DLY7894',
      supplier: 'Fresh Veg Traders',
      details: 'Vegetables • 230 kg • Nashik Farm',
      status: 'Received',
      badgeStyle: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      dateTime: '11 May, 09:30 AM',
      image: '/images/vegetables_ref.png',
    },
    {
      id: 'DLY #DLY7895',
      supplier: 'Green Valley Farms',
      details: 'Fruits • 180 kg • Pune Farm',
      status: 'In Transit',
      badgeStyle: 'bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30',
      dateTime: '11 May, 08:15 AM',
      image: '/images/fruits_ref.png',
    },
    {
      id: 'DLY #DLY7896',
      supplier: 'Daily Needs Store',
      details: 'Grains • 300 kg • Aurangabad',
      status: 'Processing',
      badgeStyle: 'bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/30',
      dateTime: '11 May, 07:00 AM',
      image: '/images/grains_ref.png',
    },
    {
      id: 'DLY #DLY7897',
      supplier: 'Dairy Connect',
      details: 'Dairy • 150 L • Nashik',
      status: 'Received',
      badgeStyle: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      dateTime: '10 May, 06:45 PM',
      image: 'dairy',
    },
  ];

  // Middle Card 3: Top Selling Products Data
  const topSellingProducts = [
    { name: 'Mango (Alphonso)', sold: '520 kg', revenue: '₹ 1,25,000', image: '/images/mango_only.png' },
    { name: 'Tomato', sold: '480 kg', revenue: '₹ 92,400', image: '/images/tomato_only.png' },
    { name: 'Potato', sold: '600 kg', revenue: '₹ 66,000', image: '/images/potato_only.png' },
    { name: 'Wheat (Premium)', sold: '350 kg', revenue: '₹ 63,000', image: '/images/wheat_only.png' },
    { name: 'Banana', sold: '310 kg', revenue: '₹ 48,500', image: '/images/banana_only.png' },
  ];

  // Lower Card 1: Expiry / Spoilage Alerts Data
  const expiryAlerts = [
    { name: 'Spinach (200 g)', sub: 'Expires in 2 days • 15 May, 2025', qty: '15 kg', risk: 'High', badge: 'bg-[#FEE2E2] text-[#991B1B]', image: '/images/greengram_only.png' },
    { name: 'Strawberry (Pack)', sub: 'Expires in 3 days • 16 May, 2025', qty: '8 Packs', risk: 'Medium', badge: 'bg-[#FEF3C7] text-[#D97706]', image: '/images/fruits_ref.png' },
    { name: 'Paneer (200 g)', sub: 'Expires in 1 day • 14 May, 2025', qty: '6 Packs', risk: 'High', badge: 'bg-[#FEE2E2] text-[#991B1B]', image: '/images/chickpea_only.png' },
  ];

  // Lower Card 2: Blockchain Verification Data
  const blockchainCerts = [
    { batchId: 'WH-120525-01', crop: 'Wheat', origin: 'Verified • Nashik Farm', date: 'Verified on 10 May, 2025' },
    { batchId: 'MN-120525-02', crop: 'Mango', origin: 'Verified • Pune Farm', date: 'Verified on 10 May, 2025' },
    { batchId: 'TM-120525-03', crop: 'Tomato', origin: 'Verified • Chhattisgarh Farm', date: 'Verified on 11 May, 2025' },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      {/* Top Header Bar */}
      <DarkStoreHeader onOpenNotifications={onOpenNotifications} />

      {/* 6 Top KPI Summary Cards (All Clickable) */}
      <DarkStoreKPICards onCardClick={(tab) => onSelectTab(tab)} />

      {/* ========================================== */}
      {/* MIDDLE DASHBOARD ROW (3 CARDS SIDE-BY-SIDE)*/}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* CARD 1: Inventory Overview (Donut Chart & Stock Breakdown) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-[#2D2620]">Inventory Overview</h2>
              <button 
                onClick={() => onSelectTab('inventory')}
                className="text-xs font-bold text-[#4D6E38] hover:text-[#354424] hover:underline cursor-pointer transition-colors"
              >
                View All
              </button>
            </div>

            {/* Donut Chart & Category Legend */}
            <div 
              onClick={() => onSelectTab('inventory')}
              className="flex items-center justify-between px-2 py-3 cursor-pointer group"
            >
              {/* SVG Donut Ring matching reference image angles & colors */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Segment 1: Fruits 32% (Dark Green #4D6E38) */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#4D6E38" strokeWidth="18" strokeDasharray="74.4 164.36" strokeDashoffset="0" />
                  {/* Segment 2: Grains 14% (Sage Beige #C3D49C) */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#C3D49C" strokeWidth="18" strokeDasharray="31.4 207.36" strokeDashoffset="-76.4" />
                  {/* Segment 3: Vegetables 28% (Yellow #EAB308) */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#EAB308" strokeWidth="18" strokeDasharray="64.8 173.96" strokeDashoffset="-109.8" />
                  {/* Segment 4: Dairy 10% (Blue #4A7AA5) */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#4A7AA5" strokeWidth="18" strokeDasharray="21.8 216.96" strokeDashoffset="-176.6" />
                  {/* Segment 5: Others 16% (Light Gray #CBC7BC) */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#CBC7BC" strokeWidth="18" strokeDasharray="36.2 202.56" strokeDashoffset="-200.4" />
                </svg>

                {/* Inner Center Circle with Text */}
                <div className="absolute w-[82px] h-[82px] rounded-full bg-white flex flex-col items-center justify-center text-center leading-tight shadow-2xs border border-[#E6E1D5]/40">
                  <span className="text-[10px] font-bold text-[#666057]">Total</span>
                  <span className="text-xl font-black text-[#1A1A1A]">186</span>
                  <span className="text-[10px] font-bold text-[#666057]">Products</span>
                </div>
              </div>

              {/* Legend List matching exact reference order & colors */}
              <div className="space-y-2 text-xs font-semibold pl-2 flex-1 max-w-[160px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#4D6E38] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Fruits</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#EAB308] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Vegetables</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#C3D49C] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Grains</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">14%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#4A7AA5] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Dairy</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#CBC7BC] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Others</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">16%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 4-Stat Stock Breakdown matching exact layout & color styling */}
          <div 
            onClick={() => onSelectTab('inventory')}
            className="grid grid-cols-4 divide-x divide-[#E6E1D5]/70 pt-3 border-t border-[#E6E1D5] text-center text-xs cursor-pointer hover:bg-[#FAF7F0]/60 transition-colors rounded-2xl p-1"
          >
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#666057] block mb-0.5">Fresh Stock</span>
              <span className="text-base font-black text-[#2D4F1E] block">132</span>
              <span className="text-[10px] font-bold text-[#666057]">(71%)</span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#E0982D] block mb-0.5">Low Stock</span>
              <span className="text-base font-black text-[#E0982D] block">18</span>
              <span className="text-[10px] font-bold text-[#666057]">(10%)</span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#666057] block mb-0.5">Out of Stock</span>
              <span className="text-base font-black text-[#B93627] block">5</span>
              <span className="text-[10px] font-bold text-[#666057]">(3%)</span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#666057] block mb-0.5">Blocked/Expired</span>
              <span className="text-base font-black text-[#B93627] block">3</span>
              <span className="text-[10px] font-bold text-[#666057]">(2%)</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Recent Incoming Deliveries */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-[#2D2620]">Recent Incoming Deliveries</h2>
              <button 
                onClick={() => onSelectTab('incoming-deliveries')}
                className="text-xs font-bold text-[#556B2F] hover:text-[#354424] hover:underline cursor-pointer transition-colors"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {recentDeliveries.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelectTab('incoming-deliveries')}
                  className="p-2.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]/70 flex items-center justify-between hover:bg-white hover:border-[#7A8B52] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E6E1D5] p-1 flex items-center justify-center flex-shrink-0">
                      {item.image === 'dairy' ? (
                        <svg viewBox="0 0 48 48" className="w-full h-full">
                          <rect x="6" y="16" width="12" height="24" rx="3" fill="#60A5FA" opacity="0.85" />
                          <rect x="9" y="10" width="6" height="6" rx="1" fill="#2563EB" />
                          <rect x="22" y="12" width="18" height="28" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
                          <rect x="27" y="6" width="8" height="6" rx="1.5" fill="#3B82F6" />
                          <circle cx="31" cy="24" r="5" fill="#93C5FD" opacity="0.4" />
                        </svg>
                      ) : (
                        <img src={item.image} alt={item.supplier} className="w-full h-full object-contain" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#2D2620]">{item.id}</span>
                        <span className="text-[11px] font-bold text-[#666057]">{item.supplier}</span>
                      </div>
                      <p className="text-[10px] text-[#666057] mt-0.5">{item.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold block mb-0.5 ${item.badgeStyle}`}>
                        {item.status}
                      </span>
                      <span className="text-[9px] text-[#8C8275] block font-medium">{item.dateTime}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C8275] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: Top Selling Products Table */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-[#2D2620]">Top Selling Products</h2>
              <div className="relative">
                <select 
                  value={topProductsFilter}
                  onChange={(e) => setTopProductsFilter(e.target.value)}
                  className="appearance-none bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl px-2.5 py-1 pr-6 text-xs font-semibold text-[#2D2620] cursor-pointer focus:outline-none"
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="This Year">This Year</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#666057] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 text-[10px] font-bold text-[#8C8275] uppercase tracking-wider pb-2 border-b border-[#E6E1D5]">
              <span className="col-span-6">Product</span>
              <span className="col-span-3 text-center">Units Sold</span>
              <span className="col-span-3 text-right">Revenue</span>
            </div>

            {/* Table Rows (Clickable -> Products page) */}
            <div className="divide-y divide-[#E6E1D5]/60 text-xs">
              {topSellingProducts.map((prod, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onSelectTab('products')}
                  className="grid grid-cols-12 items-center py-2 hover:bg-[#FAF7F0]/80 transition-colors cursor-pointer"
                >
                  <div className="col-span-6 flex items-center gap-2">
                    <img src={prod.image} alt={prod.name} className="w-6 h-6 object-contain" />
                    <span className="font-bold text-[#2D2620] truncate">{prod.name}</span>
                  </div>
                  <span className="col-span-3 text-center font-semibold text-[#666057]">{prod.sold}</span>
                  <span className="col-span-3 text-right font-extrabold text-[#2D2620]">{prod.revenue}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center border-t border-[#E6E1D5]">
            <button 
              onClick={() => onSelectTab('sales')}
              className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center justify-center gap-1 transition-colors cursor-pointer w-full"
            >
              <span>View Full Sales Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* LOWER DASHBOARD ROW (3 CARDS SIDE-BY-SIDE) */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">

        {/* CARD 4: Expiry / Spoilage Alerts */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-[#2D2620]">Expiry / Spoilage Alerts</h2>
              <button 
                onClick={() => onSelectTab('expiry-alerts')}
                className="text-xs font-bold text-[#556B2F] hover:text-[#354424] hover:underline cursor-pointer transition-colors"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {expiryAlerts.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onSelectTab('expiry-alerts')}
                  className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]/70 flex items-center justify-between hover:border-[#7A8B52] hover:bg-white transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-8 h-8 object-contain flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs text-[#2D2620] block">{item.name}</span>
                      <span className="text-[10px] text-[#B85C38] font-semibold">{item.sub}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="text-[10px] font-bold text-[#666057] block">Qty: {item.qty}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-block mt-0.5 ${item.badge}`}>
                        {item.risk}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C8275] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 5: Blockchain Verification */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-[#2D2620]">Blockchain Verification</h2>
              <button 
                onClick={() => onSelectTab('blockchain-verification')}
                className="text-xs font-bold text-[#556B2F] hover:text-[#354424] hover:underline cursor-pointer transition-colors"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {blockchainCerts.map((cert, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onSelectTab('blockchain-verification')}
                  className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]/70 space-y-1 hover:border-[#7A8B52] hover:bg-white transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-extrabold text-[#2D2620]">
                      <div className="w-5 h-5 rounded-full bg-[#EBF3E8] text-[#556B2F] flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>Batch ID: {cert.batchId}</span>
                      <span className="text-[#666057] font-semibold">• {cert.crop}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30">
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-[#666057] font-medium pl-7">
                    {cert.origin} | {cert.date}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center border-t border-[#E6E1D5]">
            <button 
              onClick={() => onSelectTab('blockchain-verification')}
              className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center justify-center gap-1 transition-colors cursor-pointer w-full"
            >
              <span>View All Certificates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 6: Revenue Overview (Line Chart & Summary Metrics) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-[#2D2620]">Revenue Overview</h2>
              <div className="relative">
                <select 
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                  className="appearance-none bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl px-2.5 py-1 pr-6 text-xs font-semibold text-[#2D2620] cursor-pointer focus:outline-none"
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="This Year">This Year</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#666057] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div 
              onClick={() => onSelectTab('revenue')}
              className="mb-2 cursor-pointer group"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#2D2620] group-hover:text-[#354424] transition-colors">₹ 11,28,450</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#666057] font-semibold">Total Revenue</span>
                <span className="text-[#556B2F] font-bold">+ 15% vs last month</span>
              </div>
            </div>

            {/* Smooth Green Area Line Chart (Clickable -> Revenue) */}
            <div 
              onClick={() => onSelectTab('revenue')}
              className="h-28 w-full relative pt-2 cursor-pointer group"
            >
              <svg viewBox="0 0 300 90" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="revenueGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#556B2F" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#556B2F" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Filled Area Below Curve */}
                <path 
                  d="M 10 70 C 40 65, 70 55, 100 58 C 130 62, 160 40, 190 48 C 220 30, 250 20, 290 12 L 290 85 L 10 85 Z" 
                  fill="url(#revenueGreenGrad)" 
                />

                {/* Main Stroke Line */}
                <path 
                  d="M 10 70 C 40 65, 70 55, 100 58 C 130 62, 160 40, 190 48 C 220 30, 250 20, 290 12" 
                  fill="none" 
                  stroke="#556B2F" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
              </svg>

              {/* X Axis Date Labels */}
              <div className="flex justify-between text-[9px] text-[#8C8275] font-semibold pt-1 border-t border-[#E6E1D5]/60">
                <span>1 May</span>
                <span>6 May</span>
                <span>11 May</span>
                <span>16 May</span>
                <span>21 May</span>
                <span>26 May</span>
                <span>31 May</span>
              </div>
            </div>
          </div>

          {/* Bottom 3 Summary Financial Metrics (Clickable) */}
          <div 
            onClick={() => onSelectTab('revenue')}
            className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E6E1D5] text-center text-xs cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] hover:bg-[#EBF3E8] transition-colors">
              <span className="text-[10px] text-[#666057] font-semibold block">Gross Profit</span>
              <span className="font-extrabold text-[#2D2620] text-xs">₹ 3,45,200</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] hover:bg-[#EBF3E8] transition-colors">
              <span className="text-[10px] text-[#666057] font-semibold block">Net Profit</span>
              <span className="font-extrabold text-[#556B2F] text-xs">₹ 2,12,800</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] hover:bg-[#EBF3E8] transition-colors">
              <span className="text-[10px] text-[#666057] font-semibold block">Avg. Order Value</span>
              <span className="font-extrabold text-[#2D2620] text-xs">₹ 1,480</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* BOTTOM HELP CENTER FOOTER BAR             */}
      {/* ========================================== */}
      <div className="bg-[#E6E3D8]/70 rounded-2xl p-4 border border-[#D9D4C7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full mt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#D9D4C7] flex items-center justify-center text-[#2D2620]">
            <HelpCircle className="w-4 h-4 text-[#354424]" />
          </div>
          <div>
            <span className="font-extrabold text-[#2D2620]">Need Help?</span>
            <span className="text-[#666057] font-medium ml-1.5">We are here to support you</span>
          </div>
        </div>

        <button className="flex items-center gap-2 text-[#2D2620] font-extrabold hover:text-[#354424] cursor-pointer transition-colors">
          <BookOpen className="w-4 h-4 text-[#354424]" />
          <span>Help Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
