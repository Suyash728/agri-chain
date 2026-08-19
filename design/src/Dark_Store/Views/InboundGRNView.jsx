import React, { useState } from 'react';
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

export const InboundGRNView = ({ onOpenNotifications }) => {
  // State for controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedDate, setSelectedDate] = useState('Select Date');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Calendar State (Default May 2025)
  const [calMonth, setCalMonth] = useState(4); // 4 = May
  const [calYear, setCalYear] = useState(2025);
  const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activePage, setActivePage] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // 12 Complete Deliveries Dataset for full 2-page pagination & date filtering
  const allDeliveries = [
    // Page 1 Items (1 to 6)
    {
      id: 'DLY #DLY7894',
      po: 'PO: PO-20345',
      supplier: 'Fresh Veg Traders',
      location: 'Nashik, Maharashtra',
      productCategory: 'Vegetables',
      productSub: 'Tomato, Potato, Onion +2',
      image: '/images/fruits_ref.png',
      quantity: '230 kg',
      weightKg: 230,
      itemsCount: '5 Items',
      expectedDate: '11 May, 09:30 AM',
      dateTag: '11 May, 2025',
      status: 'Received',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      temp: '3.8°C',
      qrSeal: 'SEAL-88901',
      driver: 'Ramesh Shinde (MH-15-EG-4021)',
    },
    {
      id: 'DLY #DLY7895',
      po: 'PO: PO-20346',
      supplier: 'Green Valley Farms',
      location: 'Pune, Maharashtra',
      productCategory: 'Fruits',
      productSub: 'Mango, Banana, Apple +1',
      image: '/images/mango_only.png',
      quantity: '180 kg',
      weightKg: 180,
      itemsCount: '4 Items',
      expectedDate: '11 May, 08:15 AM',
      dateTag: '11 May, 2025',
      status: 'In Transit',
      badgeClass: 'bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30',
      temp: '4.2°C',
      qrSeal: 'SEAL-88902',
      driver: 'Vikram Solanki (MH-12-QX-8812)',
    },
    {
      id: 'DLY #DLY7896',
      po: 'PO: PO-20347',
      supplier: 'Daily Needs Store',
      location: 'Aurangabad, Maharashtra',
      productCategory: 'Grains',
      productSub: 'Wheat, Rice, Tur Dal +1',
      image: '/images/sack_kpi.png',
      quantity: '300 kg',
      weightKg: 300,
      itemsCount: '3 Items',
      expectedDate: '11 May, 07:00 AM',
      dateTag: '11 May, 2025',
      status: 'Processing',
      badgeClass: 'bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/30',
      temp: '18.0°C',
      qrSeal: 'SEAL-88903',
      driver: 'Anand Gawli (MH-20-KT-1102)',
    },
    {
      id: 'DLY #DLY7897',
      po: 'PO: PO-20348',
      supplier: 'Dairy Connect',
      location: 'Nashik, Maharashtra',
      productCategory: 'Dairy',
      productSub: 'Milk, Paneer, Curd',
      image: '/images/chickpea_only.png',
      quantity: '150 L',
      weightKg: 150,
      itemsCount: '3 Items',
      expectedDate: '10 May, 06:45 PM',
      dateTag: '10 May, 2025',
      status: 'Received',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      temp: '2.4°C',
      qrSeal: 'SEAL-88904',
      driver: 'Suresh Kale (MH-15-DC-9090)',
    },
    {
      id: 'DLY #DLY7898',
      po: 'PO: PO-20349',
      supplier: 'Organic World',
      location: 'Nashik, Maharashtra',
      productCategory: 'Leafy Greens',
      productSub: 'Spinach, Coriander, Methi',
      image: '/images/greengram_only.png',
      quantity: '50 kg',
      weightKg: 50,
      itemsCount: '2 Items',
      expectedDate: '12 May, 10:30 AM',
      dateTag: '12 May, 2025',
      status: 'Pending',
      badgeClass: 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30',
      temp: '3.5°C',
      qrSeal: 'SEAL-88905',
      driver: 'Prakash Patil (MH-15-OW-3301)',
    },
    {
      id: 'DLY #DLY7899',
      po: 'PO: PO-20350',
      supplier: 'Farm Fresh Hub',
      location: 'Jalgaon, Maharashtra',
      productCategory: 'Root Vegetables',
      productSub: 'Carrot, Beetroot, Radish',
      image: '/images/potato_only.png',
      quantity: '120 kg',
      weightKg: 120,
      itemsCount: '3 Items',
      expectedDate: '12 May, 11:15 AM',
      dateTag: '12 May, 2025',
      status: 'In Transit',
      badgeClass: 'bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30',
      temp: '4.0°C',
      qrSeal: 'SEAL-88906',
      driver: 'Ganesh More (MH-19-FF-7720)',
    },

    // Page 2 Items (7 to 12)
    {
      id: 'DLY #DLY7900',
      po: 'PO: PO-20351',
      supplier: 'Sahyadri Agro',
      location: 'Nashik, Maharashtra',
      productCategory: 'Vegetables',
      productSub: 'Capsicum, Cucumber, Cauliflower',
      image: '/images/tomato_only.png',
      quantity: '210 kg',
      weightKg: 210,
      itemsCount: '4 Items',
      expectedDate: '12 May, 01:30 PM',
      dateTag: '12 May, 2025',
      status: 'Received',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      temp: '3.6°C',
      qrSeal: 'SEAL-88907',
      driver: 'Nitin Kadam (MH-15-SA-5511)',
    },
    {
      id: 'DLY #DLY7901',
      po: 'PO: PO-20352',
      supplier: 'Alphonso Orchards',
      location: 'Ratnagiri, Maharashtra',
      productCategory: 'Fruits',
      productSub: 'Ratnagiri Alphonso Mangoes',
      image: '/images/mango_only.png',
      quantity: '350 kg',
      weightKg: 350,
      itemsCount: '6 Items',
      expectedDate: '12 May, 03:00 PM',
      dateTag: '12 May, 2025',
      status: 'In Transit',
      badgeClass: 'bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30',
      temp: '4.8°C',
      qrSeal: 'SEAL-88908',
      driver: 'Sunil Pawar (MH-08-AO-9912)',
    },
    {
      id: 'DLY #DLY7902',
      po: 'PO: PO-20353',
      supplier: 'Mahalaxmi Pulses',
      location: 'Latur, Maharashtra',
      productCategory: 'Grains',
      productSub: 'Chana Dal, Toor Dal, Rajma',
      image: '/images/chickpea_only.png',
      quantity: '500 kg',
      weightKg: 500,
      itemsCount: '5 Items',
      expectedDate: '11 May, 05:20 PM',
      dateTag: '11 May, 2025',
      status: 'Received',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      temp: '17.5°C',
      qrSeal: 'SEAL-88909',
      driver: 'Akash Deshmukh (MH-24-MP-4402)',
    },
    {
      id: 'DLY #DLY7903',
      po: 'PO: PO-20354',
      supplier: 'Amul Co-op Dairy',
      location: 'Anand, Gujarat',
      productCategory: 'Dairy',
      productSub: 'Butter, Cheese, Flavored Milk',
      image: '/images/chickpea_only.png',
      quantity: '280 L',
      weightKg: 280,
      itemsCount: '4 Items',
      expectedDate: '11 May, 02:45 PM',
      dateTag: '11 May, 2025',
      status: 'Received',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      temp: '2.1°C',
      qrSeal: 'SEAL-88910',
      driver: 'Mahesh Shah (GJ-07-AC-8801)',
    },
    {
      id: 'DLY #DLY7904',
      po: 'PO: PO-20355',
      supplier: 'Kisan Bio Farms',
      location: 'Solapur, Maharashtra',
      productCategory: 'Fruits',
      productSub: 'Pomegranate, Watermelon',
      image: '/images/banana_only.png',
      quantity: '400 kg',
      weightKg: 400,
      itemsCount: '3 Items',
      expectedDate: '10 May, 11:30 AM',
      dateTag: '10 May, 2025',
      status: 'Received',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      temp: '5.2°C',
      qrSeal: 'SEAL-88911',
      driver: 'Vilam Shinde (MH-13-KB-2020)',
    },
    {
      id: 'DLY #DLY7905',
      po: 'PO: PO-20356',
      supplier: 'Deccan Spices Hub',
      location: 'Sangli, Maharashtra',
      productCategory: 'Spices',
      productSub: 'Turmeric Powder, Chilli Bales',
      image: '/images/spices_ref.png',
      quantity: '160 kg',
      weightKg: 160,
      itemsCount: '2 Items',
      expectedDate: '10 May, 04:15 PM',
      dateTag: '10 May, 2025',
      status: 'Received',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30',
      temp: '19.0°C',
      qrSeal: 'SEAL-88912',
      driver: 'Deepak Thorat (MH-10-DS-1100)',
    },
  ];

  // Dynamic calculations for KPI Cards
  const totalCount = allDeliveries.length;
  const receivedCount = allDeliveries.filter(d => d.status === 'Received').length;
  const inTransitCount = allDeliveries.filter(d => d.status === 'In Transit').length;
  const processingCount = allDeliveries.filter(d => d.status === 'Processing').length;
  const pendingCount = allDeliveries.filter(d => d.status === 'Pending').length;

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
  const filteredDeliveries = allDeliveries.filter((item) => {
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
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Notification Bell with Badge */}
          <button 
            onClick={onOpenNotifications}
            className="relative w-10 h-10 rounded-2xl bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-xs"
          >
            <Bell className="w-5 h-5 text-[#2D2620]" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#354424] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs">
              3
            </span>
          </button>

          {/* Date Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620]">
            <span>12 May, 2025</span>
            <Calendar className="w-4 h-4 text-[#666057]" />
          </div>

          {/* Store Selector Dropdown Pill */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs text-[#2D2620] font-medium cursor-pointer hover:bg-[#FAF7F0] transition-colors">
            <span className="text-[#666057] font-semibold">Store:</span>
            <span className="font-extrabold text-[#2D2620]">Nashik Central Store</span>
            <ChevronDown className="w-4 h-4 text-[#666057] ml-1" />
          </button>
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
                    const isToday = day === 12 && calMonth === 4 && calYear === 2025; // May 12, 2025

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
                      setCalMonth(4); // May
                      setCalYear(2025);
                      setSelectedDate('May 12, 2025');
                      setIsDatePickerOpen(false);
                      setActivePage(1);
                    }}
                    className="text-[11px] font-bold text-[#556B2F] hover:underline cursor-pointer"
                  >
                    Select Today (May 12, 2025)
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

                    {/* Actions Eye Button */}
                    <td className="py-4 px-5 text-center">
                      <button 
                        onClick={() => setSelectedDelivery(row)}
                        className="w-9 h-9 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] hover:bg-[#E6E1D5] text-[#666057] hover:text-[#2D2620] inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

        <button className="flex items-center gap-2 text-[#2D2620] font-extrabold hover:text-[#354424] cursor-pointer transition-colors">
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

    </div>
  );
};
