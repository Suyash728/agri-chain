import React, { useState } from 'react';
import { 
  ArrowLeft, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Bell, 
  Info, 
  MoreVertical, 
  X,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  QrCode,
  Tag,
  Gift,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export const DarkStoreExpiryAlertsView = ({ onBack, initialSubTab = 1 }) => {
  const [activeStepTab, setActiveStepTab] = useState(initialSubTab); // 1 = Expiry & Alerts, 2 = AI Freshness & Waste Prevention
  const [bayFilter, setBayFilter] = useState('All Bays');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedItemAction, setSelectedItemAction] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'timeline-modal', 'notifications-modal', 'fefo-modal', 'row-options-modal'
  const [selectedRowOptions, setSelectedRowOptions] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 4 Risk KPI Summary Cards
  const kpis = [
    {
      id: 'Critical',
      title: 'Critical (0-3 Days)',
      value: '12',
      subtext: 'Items need immediate action',
      bg: 'bg-[#FEE2E2]',
      border: 'border-[#FCA5A5]',
      titleColor: 'text-[#991B1B]',
      icon: 'alert-solid-red',
    },
    {
      id: 'High',
      title: 'High Risk (4-7 Days)',
      value: '18',
      subtext: 'Items expiring soon',
      bg: 'bg-[#FFF3EB]',
      border: 'border-[#FDE3D2]',
      titleColor: 'text-[#B85C38]',
      icon: 'alert-orange',
    },
    {
      id: 'Medium',
      title: 'Medium Risk (8-15 Days)',
      value: '24',
      subtext: 'Items to monitor',
      bg: 'bg-[#FEF3C7]',
      border: 'border-[#FDE68A]',
      titleColor: 'text-[#D97706]',
      icon: 'alert-yellow',
    },
    {
      id: 'Safe',
      title: 'Safe (15+ Days)',
      value: '156',
      subtext: 'Items are safe',
      bg: 'bg-[#EBF3E8]',
      border: 'border-[#D4E4CE]',
      titleColor: 'text-[#354424]',
      icon: 'check-green',
    },
  ];

  // Upcoming Expiry Timeline Data
  const timelineItems = [
    {
      name: 'Tomatoes (Grade A)',
      badge: '0-3 Days',
      badgeClass: 'bg-[#FEE2E2] text-[#991B1B]',
      location: 'Bay A (Cold) • Bin A-01',
      qty: '240 kg',
      left: '2 Days Left',
      leftColor: 'text-[#991B1B]',
      image: '/images/tomato_only.png',
      risk: 'Critical',
      expiryDate: '13 May 2025'
    },
    {
      name: 'Fresh Potatoes (5kg Bags)',
      badge: '4-7 Days',
      badgeClass: 'bg-[#FFF3EB] text-[#B85C38]',
      location: 'Bay B (Ambient) • Bin B-12',
      qty: '420 kg',
      left: '5 Days Left',
      leftColor: 'text-[#B85C38]',
      image: '/images/potato_only.png',
      risk: 'High',
      expiryDate: '16 May 2025'
    },
    {
      name: 'Nashik Red Onions',
      badge: '8-15 Days',
      badgeClass: 'bg-[#FEF3C7] text-[#D97706]',
      location: 'Bay B (Ambient) • Bin B-01',
      qty: '500 kg',
      left: '12 Days Left',
      leftColor: 'text-[#D97706]',
      image: '/images/spices_ref.png',
      risk: 'Medium',
      expiryDate: '23 May 2025'
    },
    {
      name: 'Green Peas',
      badge: '15+ Days',
      badgeClass: 'bg-[#EBF3E8] text-[#556B2F]',
      location: 'Bay C (Cold) • Bin C-02',
      qty: '310 kg',
      left: '18 Days Left',
      leftColor: 'text-[#556B2F]',
      image: '/images/greengram_only.png',
      risk: 'Safe',
      expiryDate: '31 May 2025'
    },
  ];

  // Expiry Alerts List Table Data
  const alertsTable = [
    {
      id: 'ALT-101',
      name: 'Tomatoes (Grade A)',
      location: 'Bay A (Cold) / Bin A-01',
      bayCategory: 'Bay A (Cold)',
      qty: '240 kg',
      expiryDate: '13 May 2025',
      daysLeft: '2 Days',
      daysColor: 'text-[#991B1B]',
      risk: 'Critical',
      riskBadge: 'bg-[#FEE2E2] text-[#991B1B]',
      actionType: 'Take Action',
      actionClass: 'bg-[#354424] text-white hover:bg-[#26321A]',
      image: '/images/tomato_only.png',
    },
    {
      id: 'ALT-102',
      name: 'Fresh Potatoes (5kg Bags)',
      location: 'Bay B (Ambient) / Bin B-12',
      bayCategory: 'Bay B (Ambient)',
      qty: '420 kg',
      expiryDate: '16 May 2025',
      daysLeft: '5 Days',
      daysColor: 'text-[#B85C38]',
      risk: 'High',
      riskBadge: 'bg-[#FFF3EB] text-[#B85C38]',
      actionType: 'Take Action',
      actionClass: 'bg-[#354424] text-white hover:bg-[#26321A]',
      image: '/images/potato_only.png',
    },
    {
      id: 'ALT-103',
      name: 'Nashik Red Onions',
      location: 'Bay B (Ambient) / Bin B-01',
      bayCategory: 'Bay B (Ambient)',
      qty: '500 kg',
      expiryDate: '23 May 2025',
      daysLeft: '12 Days',
      daysColor: 'text-[#D97706]',
      risk: 'Medium',
      riskBadge: 'bg-[#FEF3C7] text-[#D97706]',
      actionType: 'Take Action',
      actionClass: 'bg-[#354424] text-white hover:bg-[#26321A]',
      image: '/images/spices_ref.png',
    },
    {
      id: 'ALT-104',
      name: 'Green Gram / Moong Dal',
      location: 'Bay C (Cold) / Bin C-02',
      bayCategory: 'Bay C (Cold)',
      qty: '310 kg',
      expiryDate: '31 May 2025',
      daysLeft: '20 Days',
      daysColor: 'text-[#556B2F]',
      risk: 'Safe',
      riskBadge: 'bg-[#EBF3E8] text-[#556B2F]',
      actionType: 'Monitor',
      actionClass: 'bg-white text-[#2D2620] border border-[#E6E1D5] hover:bg-[#FAF7F0]',
      image: '/images/chickpea_only.png',
    },
    {
      id: 'ALT-105',
      name: 'Green Peas',
      location: 'Bay C (Cold) / Bin C-02',
      bayCategory: 'Bay C (Cold)',
      qty: '180 kg',
      expiryDate: '02 Jun 2025',
      daysLeft: '22 Days',
      daysColor: 'text-[#556B2F]',
      risk: 'Safe',
      riskBadge: 'bg-[#EBF3E8] text-[#556B2F]',
      actionType: 'Monitor',
      actionClass: 'bg-white text-[#2D2620] border border-[#E6E1D5] hover:bg-[#FAF7F0]',
      image: '/images/greengram_only.png',
    },
  ];

  // Filtering Logic
  const filteredTable = alertsTable.filter(item => {
    const matchesBay = bayFilter === 'All Bays' || item.bayCategory.toLowerCase().includes(bayFilter.toLowerCase());
    const matchesRisk = riskFilter === 'All' || item.risk === riskFilter;
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBay && matchesRisk && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      
      {/* Top Numbered Step Navigation Tabs (Inventory style) */}
      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-[#E6E1D5] shadow-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveStepTab(1)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${
            activeStepTab === 1
              ? 'bg-[#354424] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] hover:bg-[#E6E1D5]/60 hover:text-[#2D2620]'
          }`}
        >
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
            activeStepTab === 1 ? 'bg-white text-[#354424]' : 'bg-[#E6E1D5] text-[#666057]'
          }`}>
            1
          </span>
          <span>Expiry & Alerts</span>
        </button>

        <button
          onClick={() => setActiveStepTab(2)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${
            activeStepTab === 2
              ? 'bg-[#354424] text-white shadow-xs'
              : 'bg-[#FAF7F0] text-[#666057] hover:bg-[#E6E1D5]/60 hover:text-[#2D2620]'
          }`}
        >
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
            activeStepTab === 2 ? 'bg-white text-[#354424]' : 'bg-[#E6E1D5] text-[#666057]'
          }`}>
            2
          </span>
          <span>AI Freshness & Waste Prevention</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: EXPIRY & ALERTS MANAGEMENT VIEW                   */}
      {/* ========================================================= */}
      {activeStepTab === 1 && (
        <div className="flex flex-col gap-5 w-full animate-fade-in">
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
                  Expiry & Alerts Management
                </h1>
                <p className="text-xs text-[#666057] mt-0.5 font-medium">
                  Track expiry risks, receive smart alerts & reduce wastage
                </p>
              </div>
            </div>

            {/* Quick Filter Reset if active */}
            {riskFilter !== 'All' && (
              <button 
                onClick={() => setRiskFilter('All')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF3E8] text-[#354424] text-xs font-bold border border-[#556B2F]/30 hover:bg-[#D4E4CE] transition-colors cursor-pointer"
              >
                <span>Reset Risk Filter: <b>{riskFilter}</b></span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 4 RISK KPI SUMMARY CARDS + BAY FILTER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full items-center">
            {kpis.map((kpi) => {
              const isSelected = riskFilter === kpi.id;

              return (
                <div 
                  key={kpi.id}
                  onClick={() => setRiskFilter(riskFilter === kpi.id ? 'All' : kpi.id)}
                  className={`${kpi.bg} p-4 rounded-3xl border ${isSelected ? 'border-[#354424] ring-2 ring-[#354424]/30' : kpi.border} shadow-2xs flex items-center justify-between h-[100px] cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all relative group`}
                >
                  <div>
                    <span className={`text-[11px] font-extrabold ${kpi.titleColor} leading-tight block mb-1`}>
                      {kpi.title}
                    </span>
                    <div className="text-2xl font-black text-[#1A1A1A] leading-none mb-1">
                      {kpi.value}
                    </div>
                    <span className="text-[10px] font-semibold text-[#666057] block">
                      {kpi.subtext}
                    </span>
                  </div>

                  {/* Icon Rendering */}
                  <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
                    {kpi.icon === 'alert-solid-red' && (
                      <div className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-110 transition-transform">
                        !
                      </div>
                    )}
                    {kpi.icon === 'alert-orange' && (
                      <AlertTriangle className="w-8 h-8 text-[#B85C38] group-hover:scale-110 transition-transform" />
                    )}
                    {kpi.icon === 'alert-yellow' && (
                      <AlertTriangle className="w-8 h-8 text-[#D97706] group-hover:scale-110 transition-transform" />
                    )}
                    {kpi.icon === 'check-green' && (
                      <div className="w-8 h-8 rounded-full bg-[#556B2F] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Filter by Bay Selector */}
            <div className="bg-white p-4 rounded-3xl border border-[#E6E1D5] shadow-2xs flex flex-col justify-center h-[100px]">
              <span className="text-[11px] font-extrabold text-[#2D2620] mb-2 block">
                Filter by Bay
              </span>
              <div className="relative">
                <select 
                  value={bayFilter}
                  onChange={(e) => setBayFilter(e.target.value)}
                  className="w-full appearance-none bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl px-3 py-2 text-xs font-bold text-[#2D2620] cursor-pointer focus:outline-none focus:border-[#354424] transition-colors pr-7"
                >
                  <option value="All Bays">All Bays</option>
                  <option value="Bay A">Bay A (Cold)</option>
                  <option value="Bay B">Bay B (Ambient)</option>
                  <option value="Bay C">Bay C (Cold)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#666057] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ROW 2: DONUT CHART & UPCOMING EXPIRY TIMELINE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
            
            {/* Left Card: Expiry Overview Donut Chart */}
            <div 
              onClick={() => setActiveModal('timeline-modal')}
              className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#556B2F] transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-extrabold text-[#2D2620]">Expiry Overview</h2>
                <span className="text-xs font-bold text-[#556B2F] group-hover:underline">Details &gt;</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-1 my-auto">
                <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#D9381E" strokeWidth="18" strokeDasharray="13.7 225" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F27A18" strokeWidth="18" strokeDasharray="20.5 218" strokeDashoffset="-13.7" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F5BA13" strokeWidth="18" strokeDasharray="27.4 211" strokeDashoffset="-34.2" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#84A86E" strokeWidth="18" strokeDasharray="177.1 61.6" strokeDashoffset="-61.6" />
                  </svg>
                  <div className="absolute w-[64px] h-[64px] rounded-full bg-white flex flex-col items-center justify-center text-center leading-tight shadow-2xs border border-[#E6E1D5]/40">
                    <span className="text-[9px] font-bold text-[#666057]">Total</span>
                    <span className="text-base font-black text-[#1A1A1A]">210</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-semibold pl-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D9381E] flex-shrink-0"></span>
                      <span className="text-[#2D2620] font-bold">0-3 Days</span>
                    </div>
                    <span className="font-extrabold text-[#2D2620]">6%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F27A18] flex-shrink-0"></span>
                      <span className="text-[#2D2620] font-bold">4-7 Days</span>
                    </div>
                    <span className="font-extrabold text-[#2D2620]">9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F5BA13] flex-shrink-0"></span>
                      <span className="text-[#2D2620] font-bold">8-15 Days</span>
                    </div>
                    <span className="font-extrabold text-[#2D2620]">11%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#84A86E] flex-shrink-0"></span>
                      <span className="text-[#2D2620] font-bold">15+ Days</span>
                    </div>
                    <span className="font-extrabold text-[#2D2620]">74%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Upcoming Expiry Timeline */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold text-[#2D2620]">Upcoming Expiry Timeline</h2>
                <button 
                  onClick={() => setActiveModal('timeline-modal')}
                  className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {timelineItems.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedItemAction({
                      name: item.name,
                      location: item.bin,
                      qty: '180 kg',
                      daysLeft: item.badge,
                      risk: item.badge.includes('0-3') ? 'Critical' : item.badge.includes('4-7') ? 'High' : 'Medium',
                      expiryDate: '14 May 2025'
                    })}
                    className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex flex-col justify-between space-y-2 hover:border-[#354424] hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div>
                      <h3 className="font-extrabold text-xs text-[#2D2620] group-hover:text-[#354424] transition-colors">{item.name}</h3>
                      <span className="text-[10px] text-[#666057] block font-medium mt-0.5">{item.bin}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C8275] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ROW 3: EXPIRY ALERTS LIST DATA TABLE */}
          <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-xs overflow-hidden w-full space-y-4">
            
            <div className="p-4 sm:p-5 border-b border-[#E6E1D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-base font-extrabold text-[#2D2620]">Expiry Alerts List</h2>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search produce name..."
                    className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] placeholder-[#8C8275] focus:outline-none focus:border-[#354424]"
                  />
                  <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <button 
                  onClick={() => setActiveModal('fefo-modal')}
                  className="px-4 py-2 rounded-2xl bg-[#354424] text-white text-xs font-extrabold flex items-center gap-2 hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C3D49C]" />
                  <span>AI FEFO Optimize</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F0]/60 border-b border-[#E6E1D5] text-[11px] font-extrabold text-[#666057] uppercase tracking-wider">
                    <th className="py-3.5 px-5">ITEM NAME</th>
                    <th className="py-3.5 px-5">LOCATION / BAY</th>
                    <th className="py-3.5 px-5">QUANTITY</th>
                    <th className="py-3.5 px-5">EXPIRY DATE</th>
                    <th className="py-3.5 px-5">DAYS LEFT</th>
                    <th className="py-3.5 px-5">RISK LEVEL</th>
                    <th className="py-3.5 px-5 text-center">ACTIONS</th>
                    <th className="py-3.5 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D5]/70 text-xs font-semibold text-[#2D2620]">
                  {filteredTable.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-[#666057] font-bold">
                        No expiry alert items match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTable.map((row, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedItemAction(row)}
                        className="hover:bg-[#FAF7F0]/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] p-1 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <img src={row.image} alt={row.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="font-extrabold text-[#2D2620] group-hover:text-[#354424] transition-colors">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-[#666057] font-semibold">{row.location}</td>
                        <td className="py-4 px-5 font-extrabold text-[#2D2620]">{row.qty}</td>
                        <td className="py-4 px-5 text-[#2D2620] font-bold">{row.expiryDate}</td>
                        <td className={`py-4 px-5 font-extrabold ${row.daysColor}`}>{row.daysLeft}</td>
                        <td className="py-4 px-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block ${row.riskBadge}`}>
                            {row.risk}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedItemAction(row)}
                            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-colors ${row.actionClass}`}
                          >
                            {row.actionType}
                          </button>
                        </td>
                        <td className="py-4 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedRowOptions(row)}
                            className="p-1.5 rounded-xl hover:bg-[#E6E1D5]/60 text-[#666057] transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* ROW 4: SMART ALERTS & NOTIFICATIONS */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#2D2620]">Smart Alerts & Notifications</h2>
              <button 
                onClick={() => setActiveModal('notifications-modal')}
                className="text-xs font-bold text-[#556B2F] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div 
                onClick={() => setSelectedItemAction({
                  name: 'Tomatoes (Grade A)',
                  location: 'Bay A (Cold) / Bin A-01',
                  qty: '240 kg',
                  daysLeft: '2 Days',
                  risk: 'Critical',
                  expiryDate: '13 May 2025'
                })}
                className="p-3.5 rounded-2xl bg-[#FFF3EB] border border-[#FDE3D2] flex items-center justify-between hover:border-[#B85C38] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#B85C38]/10 text-[#B85C38] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Bell className="w-4 h-4" />
                  </div>
                  <p className="text-[#2D2620] font-semibold">
                    <span className="font-extrabold text-[#B85C38]">AI Alert:</span> <span className="font-extrabold text-[#2D2620]">Tomatoes (Grade A)</span> in Bay A (Cold) is expiring in 2 days. <span className="font-extrabold text-[#2D2620]">Suggested Action:</span> Run Flash Sale or Donate.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-[#8C8275]">10:30 AM</span>
                  <ChevronRight className="w-4 h-4 text-[#8C8275] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => setActiveModal('fefo-modal')}
                className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#DCE9FE] flex items-center justify-between hover:border-[#2563EB] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Info className="w-4 h-4" />
                  </div>
                  <p className="text-[#2D2620] font-semibold">
                    <span className="font-extrabold text-[#2563EB]">FEFO Optimization:</span> <span className="font-extrabold text-[#2D2620]">18 items</span> can be moved forward to reduce spoilage by <span className="font-extrabold text-[#556B2F]">12%</span>.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-[#8C8275]">10:30 AM</span>
                  <ChevronRight className="w-4 h-4 text-[#8C8275] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AI FRESHNESS & WASTE PREVENTION VIEW              */}
      {/* ========================================================= */}
      {activeStepTab === 2 && (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-[#E6E1D5] shadow-xs">
            <div className="flex items-center gap-3">
              {onBack && (
                <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">
                  AI Freshness & Waste Prevention 🌿
                </h1>
                <p className="text-xs text-[#666057] mt-0.5 font-medium">
                  Predictive decay modeling, live telemetry monitoring & automated 0-waste food rescue
                </p>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('fefo-modal')}
              className="px-4 py-2.5 rounded-2xl bg-[#354424] text-white text-xs font-extrabold flex items-center gap-2 hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#C3D49C]" />
              <span>Run AI FEFO Optimization</span>
            </button>
          </div>

          {/* 4 AI Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="bg-white p-5 rounded-3xl border border-[#E6E1D5] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#666057] block mb-1">Freshness Index</span>
                <span className="text-2xl font-black text-[#2D4F1E]">94.8%</span>
                <span className="text-[10px] font-semibold text-[#556B2F] block mt-1">↑ 2.4% vs last week</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#EBF3E8] border border-[#D4E4CE] flex items-center justify-center text-[#556B2F]">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E6E1D5] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#666057] block mb-1">Est. Waste Saved</span>
                <span className="text-2xl font-black text-[#2D2620]">₹48,250</span>
                <span className="text-[10px] font-semibold text-[#556B2F] block mt-1">This month via FEFO</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E6E1D5] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#666057] block mb-1">FEFO Pick Accuracy</span>
                <span className="text-2xl font-black text-[#2D2620]">99.2%</span>
                <span className="text-[10px] font-semibold text-[#556B2F] block mt-1">Optimal sequence</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#EEF4FB] border border-[#DCE9FE] flex items-center justify-center text-[#2563EB]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E6E1D5] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#666057] block mb-1">NGO Food Rescue</span>
                <span className="text-2xl font-black text-[#2D2620]">140 kg</span>
                <span className="text-[10px] font-semibold text-[#556B2F] block mt-1">Zero-waste dispatches</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#F5EEF9] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA]">
                <Gift className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Section 1: AI Telemetry Matrix Cards */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#2D2620]">AI Predictive Freshness Matrix</h2>
              <span className="text-xs font-bold text-[#556B2F] bg-[#EBF3E8] px-3 py-1 rounded-full border border-[#556B2F]/30">
                Live Sensor Telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#2D2620]">Tomatoes (Grade A)</span>
                  <span className="text-[10px] font-extrabold bg-[#FEE2E2] text-[#991B1B] px-2 py-0.5 rounded-full">2 Days Left</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#666057]">
                    <span>Temp: <b>3.1°C</b></span>
                    <span>Humidity: <b>84%</b></span>
                  </div>
                  <div className="w-full bg-[#E6E1D5] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#EF4444] h-full w-[85%]" />
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItemAction({
                    name: 'Tomatoes (Grade A)',
                    location: 'Bay A (Cold) / Bin A-01',
                    qty: '240 kg',
                    daysLeft: '2 Days',
                    risk: 'Critical',
                    expiryDate: '13 May 2025'
                  })}
                  className="w-full py-2 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A]"
                >
                  Apply 20% Markdown
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#2D2620]">Alphonso Mangoes</span>
                  <span className="text-[10px] font-extrabold bg-[#FFF3EB] text-[#B85C38] px-2 py-0.5 rounded-full">4 Days Left</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#666057]">
                    <span>Temp: <b>4.0°C</b></span>
                    <span>Humidity: <b>80%</b></span>
                  </div>
                  <div className="w-full bg-[#E6E1D5] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#B85C38] h-full w-[60%]" />
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal('fefo-modal')}
                  className="w-full py-2 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] text-xs font-bold hover:bg-[#E6E1D5]"
                >
                  Reallocate Pick Rack
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#2D2620]">Green Peas</span>
                  <span className="text-[10px] font-extrabold bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded-full">5 Days Left</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#666057]">
                    <span>Temp: <b>2.5°C</b></span>
                    <span>Humidity: <b>82%</b></span>
                  </div>
                  <div className="w-full bg-[#E6E1D5] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D97706] h-full w-[45%]" />
                  </div>
                </div>
                <button 
                  onClick={() => alert('Cooler Bay A temperature optimized to 2.0°C')}
                  className="w-full py-2 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] text-xs font-bold hover:bg-[#E6E1D5]"
                >
                  Adjust Cold Bay Temp
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#2D2620]">Organic Spinach</span>
                  <span className="text-[10px] font-extrabold bg-[#FEE2E2] text-[#991B1B] px-2 py-0.5 rounded-full">12 Hours Left</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#666057]">
                    <span>Temp: <b>18.5°C</b></span>
                    <span>Humidity: <b>55%</b></span>
                  </div>
                  <div className="w-full bg-[#E6E1D5] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#EF4444] h-full w-[95%]" />
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItemAction({
                    name: 'Organic Spinach',
                    location: 'Bay B (Ambient)',
                    qty: '40 kg',
                    daysLeft: '12 Hours',
                    risk: 'Critical',
                    expiryDate: '11 May 2025'
                  })}
                  className="w-full py-2 rounded-xl bg-[#B85C38] text-white text-xs font-bold hover:bg-[#9E4A2A]"
                >
                  Dispatch to NGO Trust
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: NGO Food Rescue Banner */}
          <div className="p-5 rounded-3xl bg-[#EFF4E9] border border-[#D9E6D3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#556B2F] text-white flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#2D2620]">Zero Food Waste Partnered Network</h3>
                <p className="text-xs text-[#666057]">140 kg of produce donated to Roti Bank Foundation and Food For All India this month.</p>
              </div>
            </div>
            <button 
              onClick={() => alert('NGO Food Rescue Receipt Generated for 140 kg produce!')}
              className="px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-extrabold hover:bg-[#26321A] cursor-pointer"
            >
              View Charity Receipts
            </button>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* INTERACTIVE ACTION MODAL (Take Action)     */}
      {/* ========================================== */}
      {selectedItemAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div>
                <h3 className="text-xl font-extrabold text-[#2D2620]">Manage Item: {selectedItemAction.name}</h3>
                <p className="text-xs text-[#666057]">Take FEFO mitigation action before batch expiry</p>
              </div>
              <button 
                onClick={() => setSelectedItemAction(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#E6E1D5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1.5">
                <div className="flex justify-between"><span className="text-[#666057] font-semibold">Location:</span> <span className="font-bold text-[#2D2620]">{selectedItemAction.location}</span></div>
                <div className="flex justify-between"><span className="text-[#666057] font-semibold">Current Stock:</span> <span className="font-extrabold text-[#2D2620]">{selectedItemAction.qty}</span></div>
                <div className="flex justify-between"><span className="text-[#666057] font-semibold">Expiry Date:</span> <span className="font-bold text-[#2D2620]">{selectedItemAction.expiryDate || '13 May 2025'}</span></div>
                <div className="flex justify-between"><span className="text-[#666057] font-semibold">Days Remaining:</span> <span className="font-extrabold text-[#991B1B]">{selectedItemAction.daysLeft || '2 Days'}</span></div>
              </div>

              <div className="space-y-2.5">
                <button 
                  onClick={() => {
                    alert(`⚡ Flash Sale published! 20% discount applied to ${selectedItemAction.name} for quick commerce dispatch.`);
                    setSelectedItemAction(null);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#354424] text-white font-extrabold flex items-center justify-center gap-2 hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
                >
                  <Tag className="w-4 h-4" />
                  <span>Trigger Quick Flash Sale (20% Off)</span>
                </button>

                <button 
                  onClick={() => {
                    alert(`🍲 Donation manifest generated for ${selectedItemAction.name}! Sent to Akshaya Patra Trust.`);
                    setSelectedItemAction(null);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] font-extrabold flex items-center justify-center gap-2 hover:bg-[#E6E1D5] transition-colors cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-[#B85C38]" />
                  <span>Donate to Food Trust NGO</span>
                </button>

                <button 
                  onClick={() => {
                    alert(`🔄 Bin position updated! ${selectedItemAction.name} moved to Pick-Face Rack A-01 for immediate dispatch.`);
                    setSelectedItemAction(null);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#EFF6FF] border border-[#DCE9FE] text-[#2563EB] font-extrabold flex items-center justify-center gap-2 hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Move Item to Front Picking Rack (FEFO First)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TIMELINE VIEW ALL MODAL                    */}
      {/* ========================================== */}
      {activeModal === 'timeline-modal' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <h3 className="text-xl font-extrabold text-[#2D2620]">Complete Upcoming Expiry Timeline</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#E6E1D5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {timelineItems.map((item, i) => (
                <div key={i} className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-8 h-8 object-contain" />
                    <div>
                      <span className="font-extrabold text-xs text-[#2D2620] block">{item.name}</span>
                      <span className="text-[10px] text-[#666057]">{item.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs block text-[#2D2620]">{item.qty}</span>
                    <span className={`text-[10px] font-bold ${item.leftColor}`}>{item.left}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* FEFO OPTIMIZATION MODAL                    */}
      {/* ========================================== */}
      {activeModal === 'fefo-modal' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-xl font-extrabold text-[#2D2620]">FEFO Optimization Plan</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#666057]">
              Our AI engine identified <b>18 SKUs</b> in Bay A & Bay B that can be shifted forward to front picking bins, reducing monthly spoilage by <b>12%</b>.
            </p>

            <button 
              onClick={() => {
                alert('FEFO Pick-Face reallocation task dispatched to store staff handheld terminals!');
                setActiveModal(null);
              }}
              className="w-full py-3 rounded-2xl bg-[#2563EB] text-white font-extrabold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              ✓ Execute Auto FEFO Bin Reallocation
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* NOTIFICATIONS VIEW ALL MODAL               */}
      {/* ========================================== */}
      {activeModal === 'notifications-modal' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <h3 className="text-xl font-extrabold text-[#2D2620]">Smart Expiry Alerts Queue</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#FFF3EB] border border-[#FDE3D2]">
                <span className="font-extrabold text-[#B85C38] block">AI Alert #1</span>
                <span>Tomatoes (Grade A) in Bay A (Cold) is expiring in 2 days. Flash sale recommended.</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#DCE9FE]">
                <span className="font-extrabold text-[#2563EB] block">FEFO Alert #2</span>
                <span>18 items can be moved forward to reduce spoilage by 12%.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ROW OPTIONS MENU MODAL                     */}
      {/* ========================================== */}
      {selectedRowOptions && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 border border-[#E6E1D5] shadow-2xl space-y-3 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D5]">
              <h4 className="font-extrabold text-sm text-[#2D2620]">{selectedRowOptions.name} Options</h4>
              <button onClick={() => setSelectedRowOptions(null)} className="text-[#666057]"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <button 
                onClick={() => { setSelectedItemAction(selectedRowOptions); setSelectedRowOptions(null); }}
                className="w-full text-left p-2 rounded-xl hover:bg-[#FAF7F0] text-[#354424] font-bold"
              >
                ⚡ Take Action (Flash Sale / Donate)
              </button>
              <button 
                onClick={() => { alert(`Barcode QR printed for ${selectedRowOptions.name}`); setSelectedRowOptions(null); }}
                className="w-full text-left p-2 rounded-xl hover:bg-[#FAF7F0] text-[#2D2620]"
              >
                🖨️ Print Batch QR & FEFO Tag
              </button>
              <button 
                onClick={() => { alert(`Audit request sent for ${selectedRowOptions.location}`); setSelectedRowOptions(null); }}
                className="w-full text-left p-2 rounded-xl hover:bg-[#FAF7F0] text-[#2D2620]"
              >
                📋 Request Shelf Stock Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
