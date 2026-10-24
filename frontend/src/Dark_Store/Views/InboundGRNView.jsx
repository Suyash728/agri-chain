import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Calendar, 
  ChevronDown, 
  SlidersHorizontal, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Bell, 
  Clock, 
  HelpCircle, 
  BookOpen, 
  ArrowRight,
  X,
  CheckCircle2,
  ThermometerSnowflake,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

import { useNotificationCount } from '../../utils/useNotificationCount';

export const InboundGRNView = ({ onBack, onOpenNotifications, onOpenGRN }) => {
  const { count, markAllAsRead } = useNotificationCount('darkstore');
  // State for controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedDate, setSelectedDate] = useState('Select Date');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Calendar State (Dynamic Current Date)
  const todayDateObj = new Date();
  const [calMonth, setCalMonth] = useState(todayDateObj.getMonth());
  const [calYear, setCalYear] = useState(todayDateObj.getFullYear());
  const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activePage, setActivePage] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [receiving, setReceiving] = useState(false);
  const [selectedStore, setSelectedStore] = useState('Nashik Central Store');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fetchInbound = () => {
    fetch('http://localhost:8000/darkstore/inbound')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDeliveries(data);
        }
      })
      .catch((err) => console.error('Error fetching inbound deliveries:', err));
  };

  useEffect(() => {
    fetchInbound();
    window.addEventListener('agrichain-data-reset', fetchInbound);
    return () => window.removeEventListener('agrichain-data-reset', fetchInbound);
  }, []);

  const handleReceive = async (delivery) => {
    setReceiving(true);
    try {
      const batchId = delivery.batchId || delivery.id.replace('DLY #', '');
      const res = await fetch('http://localhost:8000/darkstore/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId, price_paise: 140000 }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Batch ${batchId} received! Custody state transferred to IN_STORAGE on-chain (tx: ${data.tx_hash.slice(0, 10)}...).`);
        setSelectedDelivery(null);
        fetchInbound();
      } else {
        alert(`Failed to receive batch: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Network error receiving batch: ${err.message}`);
    } finally {
      setReceiving(false);
    }
  };

  // Dynamic calculations for KPI Cards
  const totalCount = deliveries.length;
  const receivedCount = deliveries.filter(d => d.status === 'Received').length;
  const inTransitCount = deliveries.filter(d => d.status === 'In Transit').length;
  const processingCount = deliveries.filter(d => d.status === 'Processing').length;
  const pendingCount = deliveries.filter(d => d.status === 'Pending').length;

  const kpiData = [
    {
      id: 'All Status',
      title: 'Total Incoming Today',
      value: String(totalCount),
      unit: 'Deliveries',
      bg: 'bg-[#EBF3E8]',
      iconText: '💰',
    },
    {
      id: 'Received',
      title: 'Received',
      value: String(receivedCount),
      unit: 'Deliveries',
      bg: 'bg-[#FFF3EB]',
      iconText: '🚚',
    },
    {
      id: 'In Transit',
      title: 'In Transit',
      value: String(inTransitCount),
      unit: 'Deliveries',
      bg: 'bg-[#EFF6FF]',
      iconText: '🚚',
    },
    {
      id: 'Processing',
      title: 'Processing',
      value: String(processingCount),
      unit: 'Deliveries',
      bg: 'bg-[#F3E8FF]',
      iconText: '⚙️',
    },
    {
      id: 'Pending',
      title: 'Pending',
      value: String(pendingCount),
      unit: 'Deliveries',
      bg: 'bg-[#FEF3C7]',
      iconText: '🕒',
    },
  ];

  // Filtering Logic across all controls
  const filteredDeliveries = deliveries.filter((item) => {
    // 1. Search Query filter
    const matchesSearch = 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.po.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Status Dropdown / KPI Filter
    if (statusFilter !== 'All Status' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // 3. Date Selection Filter (e.g., "May 12, 2025")
    if (selectedDate !== 'Select Date' && selectedDate !== 'All Dates') {
      const dayMatch = selectedDate.match(/\d+/);
      const dayStr = dayMatch ? dayMatch[0] : '';
      const matches = item.dateTag.includes(dayStr) || item.expectedDate.includes(dayStr);
      if (!matches) return false;
    }

    // 4. Modal Category Filter
    if (categoryFilter !== 'All' && !item.productCategory.toLowerCase().includes(categoryFilter.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Pagination calculation (6 items per page)
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage) || 1;
  const currentPage = Math.min(activePage, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDeliveries = filteredDeliveries.slice(startIndex, startIndex + itemsPerPage);

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('All Status');
    setSelectedDate('Select Date');
    setCategoryFilter('All');
    setActivePage(1);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF3E8] text-[#556B2F] flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">
              Incoming Deliveries
            </h1>
            <p className="text-xs text-[#666057] mt-0.5 font-medium">
              Track and manage all incoming deliveries to your dark store.
            </p>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          {/* Confirm Inbound GRN Action Button */}
          <button 
            type="button"
            onClick={() => onOpenGRN && onOpenGRN(deliveries[0]?.id || '')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
          >
            <span>📋 Confirm Inbound GRN</span>
          </button>

          {/* Notification Bell with Badge */}
          <button 
            onClick={() => {
              markAllAsRead();
              if (onOpenNotifications) onOpenNotifications();
            }}
            className="relative w-10 h-10 rounded-2xl bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-xs"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-[#2D2620]" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#354424] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs">
                {count}
              </span>
            )}
          </button>

          {/* Date Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620]">
            <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <Calendar className="w-4 h-4 text-[#666057]" />
          </div>

          {/* Store Selector Dropdown Pill */}
          <div className="relative">
            <button 
              onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs text-[#2D2620] font-medium cursor-pointer hover:bg-[#FAF7F0] transition-colors"
            >
              <span className="text-[#666057] font-semibold">Store:</span>
              <span className="font-extrabold text-[#2D2620]">{selectedStore}</span>
              <ChevronDown className={`w-4 h-4 text-[#666057] ml-1 transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isStoreDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E6E1D5] rounded-2xl shadow-xl z-50 p-1.5 animate-scale-in">
                {['Nashik Central Store', 'Pune Regional Hub', 'Mumbai Fulfillment Center'].map((store) => (
                  <button
                    key={store}
                    onClick={() => {
                      setSelectedStore(store);
                      setIsStoreDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                      selectedStore === store ? 'bg-[#FAF7F0] text-[#354424]' : 'text-[#2D2620] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <span>{store}</span>
                    {selectedStore === store && <span className="w-2 h-2 rounded-full bg-[#556B2F]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 5 COLORED KPI CARDS (INTERACTIVE)          */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full">
        {kpiData.map((kpi, idx) => {
          const isActiveKpi = statusFilter === kpi.id;
          return (
            <div 
              key={idx}
              onClick={() => {
                setStatusFilter(kpi.id);
                setActivePage(1);
              }}
              className={`${kpi.bg} p-4 sm:p-5 rounded-3xl border ${
                isActiveKpi ? 'border-[#354424] ring-2 ring-[#354424]/30' : 'border-[#E6E1D5]/80'
              } shadow-xs flex items-center justify-between transition-all hover:shadow-md cursor-pointer group`}
            >
              <div>
                <span className="text-xs font-extrabold text-[#2D2620] block leading-tight mb-2 group-hover:text-[#354424]">
                  {kpi.title}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2D2620] leading-none">
                  {kpi.value}
                </div>
                <span className="text-[11px] font-semibold text-[#666057] mt-1 block">
                  {kpi.unit}
                </span>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/80 border border-[#E6E1D5]/60 flex items-center justify-center text-lg flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {kpi.iconText}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* SEARCH AND FILTER CONTROLS BAR             */}
      {/* ========================================== */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3.5 w-full relative z-30">
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by Delivery ID, Supplier or Product"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActivePage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl text-xs text-[#2D2620] font-medium placeholder-[#8C8275] focus:outline-none focus:border-[#354424] transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-visible flex-wrap sm:flex-nowrap">
          
          {/* INTERACTIVE CALENDAR DATE PICKER */}
          <div className="relative z-50">
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all shadow-2xs whitespace-nowrap ${
                selectedDate !== 'Select Date' && selectedDate !== 'All Dates'
                  ? 'bg-[#354424] text-white border-[#354424]'
                  : 'bg-white text-[#2D2620] border-[#E6E1D5] hover:bg-[#FAF7F0]'
              }`}
            >
              <Calendar className={`w-4 h-4 ${selectedDate !== 'Select Date' && selectedDate !== 'All Dates' ? 'text-white' : 'text-[#666057]'}`} />
              <span>{selectedDate}</span>
              <ChevronDown className={`w-4 h-4 ml-1 ${selectedDate !== 'Select Date' && selectedDate !== 'All Dates' ? 'text-white' : 'text-[#666057]'}`} />
            </button>

            {/* Calendar Popover Window (Visibly positioned below Select Date button) */}
            {isDatePickerOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-3xl p-4 border border-[#E6E1D5] shadow-2xl w-80 space-y-3.5 animate-scale-in">
                
                {/* Header: Month & Year Selector Controls */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D5]">
                  <button 
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear(prev => prev - 1);
                      } else {
                        setCalMonth(prev => prev - 1);
                      }
                    }}
                    className="w-7 h-7 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Month Dropdown */}
                    <select
                      value={calMonth}
                      onChange={(e) => setCalMonth(Number(e.target.value))}
                      className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl px-2 py-1 text-xs font-bold text-[#2D2620] focus:outline-none cursor-pointer"
                    >
                      {monthsList.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>

                    {/* Year Dropdown */}
                    <select
                      value={calYear}
                      onChange={(e) => setCalYear(Number(e.target.value))}
                      className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl px-2 py-1 text-xs font-bold text-[#2D2620] focus:outline-none cursor-pointer"
                    >
                      {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear(prev => prev + 1);
                      } else {
                        setCalMonth(prev => prev + 1);
                      }
                    }}
                    className="w-7 h-7 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* All Dates Quick Option */}
                <div className="flex items-center justify-between bg-[#FAF7F0] p-2 rounded-2xl border border-[#E6E1D5]">
                  <span className="text-[11px] font-bold text-[#666057] pl-1">Show All Deliveries:</span>
                  <button
                    onClick={() => {
                      setSelectedDate('Select Date');
                      setIsDatePickerOpen(false);
                      setActivePage(1);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                      selectedDate === 'Select Date' || selectedDate === 'All Dates'
                        ? 'bg-[#354424] text-white'
                        : 'bg-white text-[#2D2620] border border-[#E6E1D5] hover:bg-[#E6E1D5]'
                    }`}
                  >
                    All Dates
                  </button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-[#8C8275] uppercase">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {/* Blank offset days for start of month */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`blank-${i}`} className="w-8 h-8 opacity-0"></div>
                  ))}

                  {/* Day Buttons 1..daysInMonth */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const formattedOpt = `${monthsList[calMonth]} ${day}, ${calYear}`;
                    const isSelected = selectedDate === formattedOpt;
                    const now = new Date();
                    const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();

                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(formattedOpt);
                          setIsDatePickerOpen(false);
                          setActivePage(1);
                        }}
                        className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#354424] text-white shadow-md scale-105'
                            : isToday
                            ? 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/40 font-black'
                            : 'text-[#2D2620] hover:bg-[#FAF7F0] hover:text-[#354424]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-[#E6E1D5] flex items-center justify-between text-xs">
                  <button 
                    onClick={() => {
                      const today = new Date();
                      setCalMonth(today.getMonth());
                      setCalYear(today.getFullYear());
                      const formatted = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                      setSelectedDate(formatted);
                      setIsDatePickerOpen(false);
                      setActivePage(1);
                    }}
                    className="text-[11px] font-bold text-[#556B2F] hover:underline cursor-pointer"
                  >
                    Select Today ({new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </button>

                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-2.5 py-1 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-[11px] font-bold text-[#666057] hover:bg-[#E6E1D5] cursor-pointer"
                  >
                    Close
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* ALL STATUS DROPDOWN */}
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setActivePage(1);
              }}
              className="appearance-none bg-white border border-[#E6E1D5] rounded-2xl px-4 py-2.5 pr-8 text-xs font-semibold text-[#2D2620] cursor-pointer hover:bg-[#FAF7F0] transition-colors focus:outline-none shadow-2xs"
            >
              <option value="All Status">All Status</option>
              <option value="Received">Received</option>
              <option value="In Transit">In Transit</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#666057] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* FILTERS DROPDOWN */}
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setActivePage(1);
              }}
              className="appearance-none bg-white border border-[#E6E1D5] rounded-2xl px-4 py-2.5 pr-8 text-xs font-semibold text-[#2D2620] cursor-pointer hover:bg-[#FAF7F0] transition-colors focus:outline-none shadow-2xs"
            >
              <option value="All">Filters</option>
              <option value="All">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Dairy">Dairy</option>
              <option value="Leafy Greens">Leafy Greens</option>
              <option value="Root Vegetables">Root Vegetables</option>
              <option value="Spices">Spices</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#666057] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters Shortcut Button if filters are active */}
          {(searchQuery || statusFilter !== 'All Status' || selectedDate !== 'Select Date' || categoryFilter !== 'All') && (
            <button 
              onClick={resetAllFilters}
              className="p-2.5 rounded-2xl bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30 hover:bg-[#B85C38] hover:text-white transition-colors cursor-pointer shadow-2xs"
              title="Reset All Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* INCOMING DELIVERIES DATA TABLE             */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F0]/60 border-b border-[#E6E1D5] text-[11px] font-extrabold text-[#666057] uppercase tracking-wider">
                <th className="py-4 px-5">Delivery ID</th>
                <th className="py-4 px-5">Supplier / Farm</th>
                <th className="py-4 px-5">Products</th>
                <th className="py-4 px-5">Quantity</th>
                <th className="py-4 px-5">Expected Date & Time</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D5]/70 text-xs font-semibold text-[#2D2620]">
              {currentDeliveries.length > 0 ? (
                currentDeliveries.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAF7F0]/50 transition-colors">
                    {/* Delivery ID */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-[#2D2620] block">{row.id}</span>
                      <span className="text-[10px] text-[#666057] font-semibold">{row.po}</span>
                    </td>

                    {/* Supplier / Farm */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-[#2D2620] block">{row.supplier}</span>
                      <span className="text-[11px] text-[#666057] font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#8C8275]" />
                        {row.location}
                      </span>
                    </td>

                    {/* Products */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] p-1 flex items-center justify-center flex-shrink-0">
                          <img src={row.image} alt={row.productCategory} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <span className="font-extrabold text-[#2D2620] block">{row.productCategory}</span>
                          <span className="text-[10px] text-[#666057] font-medium">{row.productSub}</span>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-[#2D2620] block">{row.quantity}</span>
                      <span className="text-[10px] text-[#666057] font-medium">{row.itemsCount}</span>
                    </td>

                    {/* Expected Date & Time */}
                    <td className="py-4 px-5 text-[#2D2620] font-bold">
                      {row.expectedDate}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block ${row.badgeClass}`}>
                        {row.status}
                      </span>
                    </td>

                    {/* Actions Eye Button & GRN Button */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.status === 'In Transit' && (
                          <button
                            onClick={() => handleReceive(row)}
                            disabled={receiving}
                            className="px-2.5 py-1.5 rounded-xl bg-[#556B2F] text-white hover:bg-[#435525] font-extrabold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Receive Inbound Goods (GRN)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>GRN</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedDelivery(row)}
                          className="w-9 h-9 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] hover:bg-[#E6E1D5] text-[#666057] hover:text-[#2D2620] inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#666057]">
                    <p className="font-extrabold text-sm">No incoming deliveries match your current filters.</p>
                    <button 
                      onClick={resetAllFilters}
                      className="mt-3 px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-extrabold cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination Bar */}
        <div className="p-4 bg-[#FAF7F0]/40 border-t border-[#E6E1D5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#666057] font-semibold">
            Showing {filteredDeliveries.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredDeliveries.length)} of {filteredDeliveries.length} deliveries
          </span>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setActivePage(prev => Math.max(prev - 1, 1))}
              className="w-8 h-8 rounded-xl bg-white border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#FAF7F0] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button 
                key={pageNum}
                onClick={() => setActivePage(pageNum)}
                className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center cursor-pointer transition-colors ${
                  currentPage === pageNum 
                    ? 'bg-[#354424] text-white shadow-xs' 
                    : 'bg-white border border-[#E6E1D5] text-[#2D2620] hover:bg-[#FAF7F0]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setActivePage(prev => Math.min(prev + 1, totalPages))}
              className="w-8 h-8 rounded-xl bg-white border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#FAF7F0] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* BOTTOM HELP CENTER FOOTER BAR             */}
      {/* ========================================== */}
      <div className="bg-[#E6E3D8]/70 rounded-2xl p-4 border border-[#D9D4C7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full mt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#D9D4C7] flex items-center justify-center text-[#2D2620]">
            <HelpCircle className="w-4 h-4 text-[#354424]" />
          </div>
          <div>
            <span className="font-extrabold text-[#2D2620]">Need Help?</span>
            <span className="text-[#666057] font-medium ml-1.5">We are here to support you</span>
          </div>
        </div>

        <button 
          onClick={() => setShowHelpModal(true)}
          className="flex items-center gap-2 text-[#2D2620] font-extrabold hover:text-[#354424] cursor-pointer transition-colors"
        >
          <BookOpen className="w-4 h-4 text-[#354424]" />
          <span>Help Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================== */}
      {/* DELIVERY DETAILS MODAL                     */}
      {/* ========================================== */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div>
                <h3 className="text-xl font-extrabold text-[#2D2620]">{selectedDelivery.id} Details</h3>
                <p className="text-xs text-[#666057]">{selectedDelivery.po} • {selectedDelivery.supplier}</p>
              </div>
              <button 
                onClick={() => setSelectedDelivery(null)}
                className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#E6E1D5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#666057]">Product Category</span>
                <span className="font-extrabold text-[#2D2620]">{selectedDelivery.productCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057]">Items Breakdown</span>
                <span className="font-extrabold text-[#2D2620]">{selectedDelivery.productSub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057]">Net Weight</span>
                <span className="font-extrabold text-[#354424]">{selectedDelivery.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057]">Expected Date & Time</span>
                <span className="font-extrabold text-[#2D2620]">{selectedDelivery.expectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057]">Reefer Temperature</span>
                <span className="font-extrabold text-[#2563EB] flex items-center gap-1">
                  <ThermometerSnowflake className="w-3.5 h-3.5" /> {selectedDelivery.temp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057]">QR Seal Code</span>
                <span className="font-extrabold text-[#2D2620] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#556B2F]" /> {selectedDelivery.qrSeal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666057]">Transporter / Driver</span>
                <span className="font-bold text-[#2D2620]">{selectedDelivery.driver}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              {selectedDelivery.status === 'In Transit' && (
                <button 
                  onClick={() => handleReceive(selectedDelivery)}
                  disabled={receiving}
                  className="w-full py-3 rounded-2xl bg-[#556B2F] text-white font-extrabold text-xs sm:text-sm hover:bg-[#435525] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {receiving ? 'Recording on Blockchain...' : '✓ Receive Goods (GRN)'}
                </button>
              )}
              <button 
                onClick={() => setSelectedDelivery(null)}
                className="w-full py-3 rounded-2xl bg-[#354424] text-white font-extrabold text-xs sm:text-sm hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Help Center Operations Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#354424]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#2D2620]">Dark Store Operations Guide</h3>
                  <p className="text-xs text-[#666057]">Inbound GRN, FEFO storage & cold-chain SOPs</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2D2620]">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
                <span className="font-extrabold text-[#354424] block">1. Goods Receipt Note (GRN) Verification</span>
                <p className="text-[#666057]">Verify digital manifests against physical transporter pallets. Record lot count, weight and quality grade before smart-contract custody release.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
                <span className="font-extrabold text-[#354424] block">2. Bay Allocation & FEFO Priority</span>
                <p className="text-[#666057]">Produce with shorter shelf-life is automatically assigned to Bay A (Cold 2-4°C) with highest dispatch priority to prevent food waste.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
                <span className="font-extrabold text-[#354424] block">3. 24x7 Operations Support Hotline</span>
                <p className="text-[#666057]">Toll-Free: 1800-AGRI-DS (+91 1800 247 4786) | darkstore-support@agrichain.com</p>
              </div>
            </div>

            <button 
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 rounded-xl bg-[#354424] text-white font-extrabold text-xs hover:bg-[#26321A] transition-colors cursor-pointer"
            >
              Close Help Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
