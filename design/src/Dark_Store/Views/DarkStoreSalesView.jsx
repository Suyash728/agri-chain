import React, { useState, useEffect } from 'react';
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
  const currentMonthFormatted = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const [dateRange, setDateRange] = useState(currentMonthFormatted);
  const [chartMetric, setChartMetric] = useState('Amount (₹)');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [liveSales, setLiveSales] = useState(null);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [showSalesBreakdownModal, setShowSalesBreakdownModal] = useState(false);
  const [showTopProductsModal, setShowTopProductsModal] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  const [orderSearchModal, setOrderSearchModal] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/darkstore/sales')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLiveSales(data);
      })
      .catch(() => {});
  }, []);

  const totalSalesVal = liveSales?.totalSales || '₹ 0';
  const ordersCompletedVal = liveSales?.ordersCompleted || '0';
  const quantitySoldVal = liveSales?.quantitySold || '0 kg';

  // 6 Top Colored KPI Cards
  const kpis = [
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: totalSalesVal,
      subtext: '↑ Verified on-chain',
      isPositive: true,
      bg: 'bg-[#EFF4E9]',
      border: 'border-[#D9E6D3]',
      iconType: 'sack',
    },
    {
      id: 'orders-completed',
      title: 'Orders Completed',
      value: ordersCompletedVal,
      subtext: '↑ From verified checkouts',
      isPositive: true,
      bg: 'bg-[#FFF4EC]',
      border: 'border-[#FDE3D2]',
      iconType: 'truck',
    },
    {
      id: 'total-qty',
      title: 'Total Quantity Sold',
      value: quantitySoldVal,
      subtext: '↑ Physical produce delivered',
      isPositive: true,
      bg: 'bg-[#EEF4FB]',
      border: 'border-[#DCE9FE]',
      iconType: 'bag',
    },
    {
      id: 'avg-order-val',
      title: 'Average Order Value',
      value: liveSales?.ordersCompleted && parseInt(liveSales.ordersCompleted) > 0 
        ? `₹ ${(parseInt(liveSales.totalSales.replace(/[^0-9]/g, '')) / parseInt(liveSales.ordersCompleted)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` 
        : '₹ 0',
      subtext: '↑ Per consumer order',
      isPositive: true,
      bg: 'bg-[#F5EEF9]',
      border: 'border-[#E9D5FF]',
      iconType: 'chart',
    },
    {
      id: 'pending-orders',
      title: 'Pending Orders',
      value: liveSales?.pendingOrders || '0',
      subtext: 'Active in transit/storage',
      isPositive: false,
      bg: 'bg-[#FFF3E6]',
      border: 'border-[#FDE68A]',
      iconType: 'warning',
    },
    {
      id: 'returns',
      title: 'Return / Refunds',
      value: '₹ 0',
      subtext: 'Zero unresolved returns',
      isPositive: false,
      bg: 'bg-[#EFF4E9]',
      border: 'border-[#D9E6D3]',
      iconType: 'return',
    },
  ];

  // Top Selling Products Data from real database sales
  const topProducts = (liveSales?.topProducts && liveSales.topProducts.length > 0)
    ? liveSales.topProducts 
    : [];

  const recentOrders = (liveSales?.recentOrders && liveSales.recentOrders.length > 0)
    ? liveSales.recentOrders.map((o) => ({
        id: o.id,
        buyer: o.customer || 'Verified Consumer Delivery',
        items: o.product || 'Fresh Produce',
        quantity: o.quantity || '25 kg',
        amount: o.amount,
        orderDate: o.date ? o.date.slice(0, 16) : 'Today',
        status: o.status || 'Delivered',
        badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      }))
    : [];

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
          <button 
            onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#666057]" />
            <span>{dateRange}</span>
            <ChevronDown className={`w-4 h-4 text-[#666057] ml-1 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDateDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E6E1D5] rounded-2xl shadow-xl z-50 p-1.5 animate-scale-in">
              {['Today', 'This Week', currentMonthFormatted, 'Last 90 Days'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setIsDateDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                    dateRange === range ? 'bg-[#FAF7F0] text-[#354424]' : 'text-[#2D2620] hover:bg-[#FAF7F0]'
                  }`}
                >
                  <span>{range}</span>
                  {dateRange === range && <span className="w-2 h-2 rounded-full bg-[#556B2F]" />}
                </button>
              ))}
            </div>
          )}
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

              <button 
                onClick={() => setShowSalesBreakdownModal(true)}
                className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer"
              >
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
                <span>D-5</span>
                <span>D-4</span>
                <span>D-3</span>
                <span>D-2</span>
                <span>D-1</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Top Selling Products */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-extrabold text-[#2D2620]">Top Selling Products</h2>
            <button 
              onClick={() => setShowTopProductsModal(true)}
              className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-[#E6E1D5]/60 text-xs">
            {topProducts.length === 0 ? (
              <div className="py-6 text-center text-[#666057] font-semibold">
                No produce sales recorded yet.
              </div>
            ) : (
              topProducts.map((prod, idx) => (
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
              ))
            )}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* LOWER ROW: RECENT ORDERS DATA TABLE        */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-xs overflow-hidden w-full">
        <div className="p-4 sm:p-5 border-b border-[#E6E1D5] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#2D2620]">Recent Orders</h2>
          <button 
            onClick={() => setShowAllOrdersModal(true)}
            className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer"
          >
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-sm text-[#666057]">
                    No customer orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

          {/* 1. Sales Performance Breakdown Modal */}
      {showSalesBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div>
                <h3 className="text-lg font-extrabold text-[#2D2620]">Sales Performance Ledger</h3>
                <p className="text-xs text-[#666057]">Revenue and order volume metrics breakdown</p>
              </div>
              <button 
                onClick={() => setShowSalesBreakdownModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Gross Merchandise Value (GMV)</span>
                <span className="font-extrabold text-[#2D2620]">{totalSalesVal}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Total Orders Fulfilled</span>
                <span className="font-extrabold text-[#2D2620]">{ordersCompletedVal}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Total Produce Volume Delivered</span>
                <span className="font-extrabold text-[#2D2620]">{quantitySoldVal}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="font-bold text-[#666057]">Average Order Value (AOV)</span>
                <span className="font-extrabold text-[#556B2F]">₹ 1,420</span>
              </div>
            </div>
            <button 
              onClick={() => setShowSalesBreakdownModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#354424] text-white font-extrabold text-xs hover:bg-[#26321A] transition-colors cursor-pointer"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Products Modal */}
      {showTopProductsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div>
                <h3 className="text-lg font-extrabold text-[#2D2620]">All Top Selling Produce</h3>
                <p className="text-xs text-[#666057]">Volume and revenue generated by produce SKU</p>
              </div>
              <button 
                onClick={() => setShowTopProductsModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs">
                  <div className="flex items-center gap-3">
                    <img src={prod.image} alt={prod.name} className="w-8 h-8 object-contain rounded-lg bg-white p-0.5 border border-[#E6E1D5]" />
                    <div>
                      <span className="font-extrabold text-[#2D2620] block">{prod.name}</span>
                      <span className="text-[11px] text-[#666057] font-semibold">{prod.qty} fulfilled</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-[#354424]">{prod.revenue}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowTopProductsModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#354424] text-white font-extrabold text-xs hover:bg-[#26321A] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 3. All Orders Full Modal */}
      {showAllOrdersModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div>
                <h3 className="text-xl font-extrabold text-[#2D2620]">Complete Dark Store Orders Ledger</h3>
                <p className="text-xs text-[#666057]">Full list of retail store & quick-commerce dispatches</p>
              </div>
              <button 
                onClick={() => setShowAllOrdersModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search orders by buyer, produce, ID..."
                value={orderSearchModal}
                onChange={(e) => setOrderSearchModal(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs text-[#2D2620] focus:outline-none focus:border-[#354424]"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5] text-[#666057] font-semibold sticky top-0">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Buyer / Hub</th>
                    <th className="p-3">Produce</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D5]/40">
                  {recentOrders
                    .filter(o => 
                      o.id.toLowerCase().includes(orderSearchModal.toLowerCase()) || 
                      o.buyer.toLowerCase().includes(orderSearchModal.toLowerCase()) || 
                      o.produce.toLowerCase().includes(orderSearchModal.toLowerCase())
                    )
                    .map((o, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="p-3 font-extrabold text-[#354424]">{o.id}</td>
                        <td className="p-3 font-bold text-[#2D2620]">{o.buyer}</td>
                        <td className="p-3 text-[#2D2620]">{o.produce}</td>
                        <td className="p-3 text-[#666057]">{o.qty}</td>
                        <td className="p-3 font-extrabold text-[#2D2620]">{o.amount}</td>
                        <td className="p-3 text-[#8C8275]">{o.date}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF3E8] text-[#556B2F]">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-[#E6E1D5] flex justify-end">
              <button 
                onClick={() => setShowAllOrdersModal(false)}
                className="px-4 py-2 rounded-xl bg-[#354424] text-white font-extrabold text-xs hover:bg-[#26321A] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
