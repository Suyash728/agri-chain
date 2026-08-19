import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronDown, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Search,
  Filter,
  X
} from 'lucide-react';

export const DarkStoreSalesView = ({ onBack }) => {
  const [dateRange, setDateRange] = useState('May 01 – May 11, 2025');
  const [chartMetric, setChartMetric] = useState('Amount (₹)');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 6 Top Colored KPI Cards
  const kpis = [
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: '₹ 11,28,450',
      subtext: '↑ 15% from last month',
      isPositive: true,
      bg: 'bg-[#EFF4E9]',
      border: 'border-[#D9E6D3]',
      iconType: 'sack',
    },
    {
      id: 'orders-completed',
      title: 'Orders Completed',
      value: '243',
      subtext: '↑ 12% from last month',
      isPositive: true,
      bg: 'bg-[#FFF4EC]',
      border: 'border-[#FDE3D2]',
      iconType: 'truck',
    },
    {
      id: 'total-qty',
      title: 'Total Quantity Sold',
      value: '4,250 kg',
      subtext: '↑ 10% from last month',
      isPositive: true,
      bg: 'bg-[#EEF4FB]',
      border: 'border-[#DCE9FE]',
      iconType: 'bag',
    },
    {
      id: 'avg-order-val',
      title: 'Average Order Value',
      value: '₹ 4,642',
      subtext: '↑ 8% from last month',
      isPositive: true,
      bg: 'bg-[#F5EEF9]',
      border: 'border-[#E9D5FF]',
      iconType: 'chart',
    },
    {
      id: 'pending-orders',
      title: 'Pending Orders',
      value: '18',
      subtext: '↓ 5% from last month',
      isPositive: false,
      bg: 'bg-[#FFF3E6]',
      border: 'border-[#FDE68A]',
      iconType: 'warning',
    },
    {
      id: 'returns',
      title: 'Return / Refunds',
      value: '₹ 12,350',
      subtext: '↓ 3% from last month',
      isPositive: false,
      bg: 'bg-[#EFF4E9]',
      border: 'border-[#D9E6D3]',
      iconType: 'return',
    },
  ];

  // Top Selling Products Data
  const topProducts = [
    { name: 'Tomatoes (Grade A)', qty: '1,250 kg', revenue: '₹ 3,12,500', image: '/images/tomato_only.png' },
    { name: 'Green Peas', qty: '850 kg', revenue: '₹ 2,10,750', image: '/images/greengram_only.png' },
    { name: 'Red Onions', qty: '720 kg', revenue: '₹ 1,68,400', image: '/images/spices_ref.png' },
    { name: 'Potatoes', qty: '640 kg', revenue: '₹ 1,24,800', image: '/images/potato_only.png' },
    { name: 'Spinach', qty: '520 kg', revenue: '₹ 1,11,000', image: '/images/vegetables_ref.png' },
  ];

  // Recent Orders Data
  const recentOrders = [
    {
      id: 'ORD-78941',
      buyer: 'Fresh Mart Retailers',
      items: 'Tomatoes (Grade A)',
      quantity: '120 kg',
      amount: '₹ 2,880',
      orderDate: '11 May, 09:30 AM',
      status: 'Delivered',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
    },
    {
      id: 'ORD-78940',
      buyer: 'GreenBasket Stores',
      items: 'Green Peas',
      quantity: '80 kg',
      amount: '₹ 1,920',
      orderDate: '11 May, 08:15 AM',
      status: 'Delivered',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
    },
    {
      id: 'ORD-78939',
      buyer: 'Daily Needs Store',
      items: 'Potatoes',
      quantity: '150 kg',
      amount: '₹ 2,400',
      orderDate: '11 May, 07:00 AM',
      status: 'Processing',
      badgeClass: 'bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/30',
    },
    {
      id: 'ORD-78938',
      buyer: 'City Supermart',
      items: 'Red Onions',
      quantity: '100 kg',
      amount: '₹ 2,200',
      orderDate: '10 May, 06:45 PM',
      status: 'Shipped',
      badgeClass: 'bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30',
    },
    {
      id: 'ORD-78937',
      buyer: 'Organic Plaza',
      items: 'Spinach',
      quantity: '60 kg',
      amount: '₹ 1,260',
      orderDate: '10 May, 05:30 PM',
      status: 'Delivered',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
    },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full pt-1 pb-1">
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
              Sales Dashboard
            </h1>
            <p className="text-xs text-[#666057] mt-0.5 font-medium">
              Track sales performance, orders, and product-wise insights
            </p>
          </div>
        </div>

        {/* Date Range Selector Pill */}
        <div className="relative">
          <button className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer">
            <Calendar className="w-4 h-4 text-[#666057]" />
            <span>{dateRange}</span>
            <ChevronDown className="w-4 h-4 text-[#666057] ml-1" />
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 6 TOP COLORED KPI CARDS                    */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 w-full">
        {kpis.map((kpi) => (
          <div 
            key={kpi.id}
            className={`${kpi.bg} p-3.5 rounded-2xl border ${kpi.border} shadow-2xs hover:shadow-xs hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-[104px] group`}
          >
            <span className="text-[11px] font-extrabold text-[#2D2620] leading-tight block">
              {kpi.title}
            </span>

            <div className="flex items-center justify-between gap-1 my-auto">
              <span className="text-lg sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#354424] transition-colors tracking-tight">
                {kpi.value}
              </span>

              {/* KPI Icon Rendering */}
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                {kpi.iconType === 'sack' && (
                  <svg viewBox="0 0 64 64" className="w-full h-full">
                    <path d="M 24 16 C 24 10, 40 10, 40 16 C 44 18, 48 22, 50 28 C 54 40, 52 54, 42 58 C 32 60, 20 58, 14 48 C 10 38, 12 26, 18 18 Z" fill="#88A070" />
                    <path d="M 22 18 C 22 18, 32 22, 42 18 C 40 15, 38 12, 32 12 C 26 12, 24 15, 22 18 Z" fill="#6B8454" />
                    <path d="M 22 22 C 28 24, 36 24, 42 22" stroke="#4D623A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <text x="32" y="44" textAnchor="middle" fontSize="18" fontWeight="900" fill="#2E3A1F" fontFamily="sans-serif">₹</text>
                  </svg>
                )}

                {kpi.iconType === 'truck' && (
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
                )}

                {kpi.iconType === 'bag' && (
                  <svg viewBox="0 0 54 60" className="w-full h-full">
                    <path d="M 20 18 C 20 8, 34 8, 34 18" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <rect x="8" y="18" width="38" height="38" rx="6" fill="#4B8BF5" />
                    <path d="M 8 18 Q 27 24 46 18 L 46 56 L 8 56 Z" fill="#2563EB" opacity="0.3" />
                    <path d="M 21 24 C 23 28, 31 28, 33 24" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
                  </svg>
                )}

                {kpi.iconType === 'chart' && (
                  <svg viewBox="0 0 54 54" className="w-full h-full">
                    <rect x="6" y="32" width="10" height="18" rx="2" fill="#B8B2A6" />
                    <rect x="22" y="20" width="10" height="30" rx="2" fill="#9E9689" />
                    <rect x="38" y="10" width="10" height="40" rx="2" fill="#7D7569" />
                  </svg>
                )}

                {kpi.iconType === 'warning' && (
                  <svg viewBox="0 0 54 54" className="w-full h-full">
                    <path d="M 27 6 L 49 44 Q 52 49 46 49 L 8 49 Q 2 49 5 44 Z" fill="#F59E0B" />
                    <text x="27" y="41" textAnchor="middle" fontSize="26" fontWeight="900" fill="white" fontFamily="sans-serif">!</text>
                  </svg>
                )}

                {kpi.iconType === 'return' && (
                  <svg viewBox="0 0 54 54" className="w-full h-full">
                    <circle cx="27" cy="27" r="22" fill="#88A070" opacity="0.2" />
                    <path d="M 36 27 C 36 32, 32 36, 27 36 C 22 36, 18 32, 18 27 C 18 22, 22 18, 27 18 L 34 18" stroke="#354424" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M 30 13 L 36 18 L 30 23" stroke="#354424" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
            </div>

            <p className={`text-[10px] font-bold flex items-center gap-1 leading-none ${
              kpi.isPositive ? 'text-[#354424]' : 'text-[#B85C38]'
            }`}>
              <span>{kpi.subtext.split(' ')[0]} {kpi.subtext.split(' ')[1]}</span>
              <span className="text-[#666057] font-medium">{kpi.subtext.split(' ').slice(2).join(' ')}</span>
            </p>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* MIDDLE ROW: SALES OVERVIEW & TOP SELLING   */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* LEFT CARD: Sales Overview (Line Chart) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#2D2620]">Sales Overview</h2>
            <div className="flex items-center gap-3">
              {/* Metric Filter Dropdown */}
              <div className="relative">
                <select 
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value)}
                  className="appearance-none bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-[#2D2620] cursor-pointer focus:outline-none"
                >
                  <option value="Amount (₹)">Amount (₹)</option>
                  <option value="Orders Count">Orders Count</option>
                  <option value="Volume (kg)">Volume (kg)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#666057] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer">
                View All
              </button>
            </div>
          </div>

          {/* SVG Line Chart with Node Dots matching reference screenshot */}
          <div className="h-64 w-full relative pt-2">
            <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] font-bold text-[#8C8275] text-right pr-2">
              <span>200K</span>
              <span>150K</span>
              <span>100K</span>
              <span>50K</span>
              <span>0</span>
            </div>

            <div className="ml-10 h-56 relative border-b border-l border-[#E6E1D5]/70">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGreenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#556B2F" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#556B2F" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                <line x1="0" y1="0" x2="500" y2="0" stroke="#E6E1D5" strokeDasharray="3 3" opacity="0.5" />
                <line x1="0" y1="50" x2="500" y2="50" stroke="#E6E1D5" strokeDasharray="3 3" opacity="0.5" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#E6E1D5" strokeDasharray="3 3" opacity="0.5" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#E6E1D5" strokeDasharray="3 3" opacity="0.5" />

                {/* Filled Area below Line */}
                <path 
                  d="M 10 115 L 50 78 L 90 68 L 130 38 L 175 75 L 215 125 L 255 98 L 295 70 L 335 110 L 375 108 L 415 88 L 455 128 L 490 102 L 490 200 L 10 200 Z" 
                  fill="url(#salesGreenGradient)" 
                />

                {/* Smooth Chart Line */}
                <path 
                  d="M 10 115 L 50 78 L 90 68 L 130 38 L 175 75 L 215 125 L 255 98 L 295 70 L 335 110 L 375 108 L 415 88 L 455 128 L 490 102" 
                  fill="none" 
                  stroke="#556B2F" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Plotted Node Dots matching reference screenshot */}
                {[
                  { x: 10, y: 115 },
                  { x: 50, y: 78 },
                  { x: 90, y: 68 },
                  { x: 130, y: 38 }, // Peak at May 04
                  { x: 175, y: 75 },
                  { x: 215, y: 125 },
                  { x: 255, y: 98 },
                  { x: 295, y: 70 },
                  { x: 335, y: 110 },
                  { x: 375, y: 108 },
                  { x: 415, y: 88 },
                  { x: 455, y: 128 },
                  { x: 490, y: 102 },
                ].map((pt, i) => (
                  <circle 
                    key={i} 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4" 
                    fill="#556B2F" 
                    stroke="white" 
                    strokeWidth="2" 
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                ))}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] font-bold text-[#8C8275] pt-2">
                <span>May 01</span>
                <span>May 03</span>
                <span>May 05</span>
                <span>May 07</span>
                <span>May 09</span>
                <span>May 11</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Top Selling Products */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-extrabold text-[#2D2620]">Top Selling Products</h2>
            <button className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer">
              View All
            </button>
          </div>

          <div className="divide-y divide-[#E6E1D5]/60 text-xs">
            {topProducts.map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 hover:bg-[#FAF7F0]/60 transition-colors cursor-pointer rounded-xl px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] p-1 flex items-center justify-center flex-shrink-0">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-extrabold text-[#2D2620]">{prod.name}</span>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <span className="font-semibold text-[#666057]">{prod.qty}</span>
                  <span className="font-extrabold text-[#2D2620] min-w-[75px]">{prod.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* LOWER ROW: RECENT ORDERS DATA TABLE        */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-xs overflow-hidden w-full">
        <div className="p-4 sm:p-5 border-b border-[#E6E1D5] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#2D2620]">Recent Orders</h2>
          <button className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F0]/60 border-b border-[#E6E1D5] text-[11px] font-extrabold text-[#666057] uppercase tracking-wider">
                <th className="py-3.5 px-5">ORDER ID</th>
                <th className="py-3.5 px-5">BUYER / CUSTOMER</th>
                <th className="py-3.5 px-5">ITEMS</th>
                <th className="py-3.5 px-5">QUANTITY</th>
                <th className="py-3.5 px-5">AMOUNT (₹)</th>
                <th className="py-3.5 px-5">ORDER DATE</th>
                <th className="py-3.5 px-5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D5]/70 text-xs font-semibold text-[#2D2620]">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FAF7F0]/50 transition-colors">
                  {/* Order ID */}
                  <td className="py-4 px-5 font-extrabold text-[#2D2620]">{ord.id}</td>

                  {/* Buyer / Customer */}
                  <td className="py-4 px-5 font-bold text-[#2D2620]">{ord.buyer}</td>

                  {/* Items */}
                  <td className="py-4 px-5 text-[#2D2620]">{ord.items}</td>

                  {/* Quantity */}
                  <td className="py-4 px-5 font-extrabold text-[#2D2620]">{ord.quantity}</td>

                  {/* Amount */}
                  <td className="py-4 px-5 font-extrabold text-[#2D2620]">{ord.amount}</td>

                  {/* Order Date */}
                  <td className="py-4 px-5 text-[#666057] font-semibold">{ord.orderDate}</td>

                  {/* Status Badge */}
                  <td className="py-4 px-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block ${ord.badgeClass}`}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
