import React, { useState } from 'react';
import { LogisticHeader } from '../components/LogisticHeader';
import { LogisticKPICards } from '../components/LogisticKPICards';
import { 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  Building2, 
  Package, 
  ArrowRight, 
  Sparkles, 
  CheckCircle,
  Link2
} from 'lucide-react';

export const LogisticDashboardView = ({ onSelectTab, onOpenNotifications }) => {
  const [procurementFilter, setProcurementFilter] = useState('All');

  // 1. Available Produce Concise Summary Data
  const availableProduceList = [
    { name: 'Wheat', icon: '/images/wheat_only.png', qty: '500 Tonnes', price: '₹ 2,100', status: 'In Stock', badge: 'bg-[#556B2F]/15 text-[#556B2F]' },
    { name: 'Rice', icon: '/images/rice_only.png', qty: '300 Tonnes', price: '₹ 2,800', status: 'In Stock', badge: 'bg-[#556B2F]/15 text-[#556B2F]' },
    { name: 'Tomato', icon: '/images/tomato_only.png', qty: '200 Tonnes', price: '₹ 1,200', status: 'Limited', badge: 'bg-[#B85C38]/15 text-[#B85C38]' },
    { name: 'Potato', icon: '/images/potato_only.png', qty: '400 Tonnes', price: '₹ 1,000', status: 'In Stock', badge: 'bg-[#556B2F]/15 text-[#556B2F]' },
  ];

  // 2. Procurement / Orders Concise Summary Data
  const procurementOrdersList = [
    { id: 'ORD1256', supplier: 'FreshMart Supply Co.', produce: 'Wheat (500 kg)', status: 'Confirmed', badgeClass: 'bg-[#556B2F]/15 text-[#556B2F]' },
    { id: 'ORD1255', supplier: 'Green Valley Traders', produce: 'Tomato (400 kg)', status: 'Pending', badgeClass: 'bg-[#B85C38]/15 text-[#B85C38]' },
    { id: 'ORD1254', supplier: 'Daily Needs Store', produce: 'Potato (600 kg)', status: 'In Progress', badgeClass: 'bg-[#2B6CB0]/15 text-[#2B6CB0]' },
  ];

  const filteredOrders = procurementFilter === 'All' 
    ? procurementOrdersList 
    : procurementOrdersList.filter(o => o.status === procurementFilter);

  // 3. Transportation Concise Summary Data
  const activeVehiclesList = [
    { number: 'MH12 AB 1234', status: 'In Transit', badgeClass: 'bg-[#556B2F]/15 text-[#556B2F]', driver: 'Ramesh Yadav', route: 'Nashik → Pune' },
    { number: 'MH15 CD 5678', status: 'Loading', badgeClass: 'bg-[#B85C38]/15 text-[#B85C38]', driver: 'Suresh Patil', route: 'Raipur → Nagpur' },
    { number: 'UP14 EF 9101', status: 'Delivered', badgeClass: 'bg-gray-100 text-gray-700', driver: 'Arvind Kumar', route: 'Aligarh → Nashik' },
  ];

  // 4. Inventory Category Summary Data
  const inventoryCategories = [
    { category: 'Grains (Wheat & Rice)', qty: '3,200 Tonnes', pct: 40 },
    { category: 'Pulses & Legumes', qty: '2,100 Tonnes', pct: 27 },
    { category: 'Fruits & Vegetables', qty: '1,500 Tonnes', pct: 19 },
    { category: 'Spices & Dry Fruits', qty: '1,050 Tonnes', pct: 14 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. TOP HEADER & ALL 4 KPI SUMMARY CARDS (100% UNCHANGED) */}
      <LogisticHeader onOpenNotifications={onOpenNotifications} />
      <LogisticKPICards onCardClick={onSelectTab} />

      {/* ============================================================== */}
      {/* 2. LOWER DASHBOARD SUMMARY SECTION (REDESIGNED & CONCISE)      */}
      {/* ============================================================== */}
      
      {/* ROW 1: Available Produce, Procurement / Orders, Transportation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: AVAILABLE PRODUCE Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌽</span>
                <h2 className="text-base font-extrabold text-[#2D2620]">Available Produce</h2>
              </div>
              <button 
                onClick={() => onSelectTab('inventory')}
                className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-[#666057] mb-3">Verified farm-gate produce ready for procurement</p>

            <div className="space-y-2.5">
              {availableProduceList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F0]/60 border border-[#E6E1D5]/60">
                  <div className="flex items-center gap-2.5">
                    <img src={item.icon} alt={item.name} className="w-6 h-6 object-contain" />
                    <div>
                      <h4 className="font-extrabold text-xs text-[#2D2620]">{item.name}</h4>
                      <span className="text-[10px] text-[#666057]">{item.qty}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs text-[#556B2F] block">{item.price}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.badge}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: PROCUREMENT / ORDERS Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <h2 className="text-base font-extrabold text-[#2D2620]">Procurement / Orders</h2>
              </div>
              <button 
                onClick={() => onSelectTab('procurement-orders')}
                className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
              {['All', 'Pending', 'Confirmed', 'In Progress'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProcurementFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    procurementFilter === tab ? 'bg-[#354424] text-white shadow-xs' : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]/60'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {filteredOrders.map((order, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#FAF7F0]/60 border border-[#E6E1D5]/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#2D2620]">{order.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${order.badgeClass}`}>{order.status}</span>
                    </div>
                    <p className="text-[11px] text-[#666057] mt-0.5">{order.supplier}</p>
                    <p className="text-[10px] text-[#8C8275]">{order.produce}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C8275]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: TRANSPORTATION Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚚</span>
                <h2 className="text-base font-extrabold text-[#2D2620]">Transportation</h2>
              </div>
              <button 
                onClick={() => onSelectTab('transportation')}
                className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Active Fleet Metric Header */}
            <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#666057] font-semibold">Active Fleet Vehicles</span>
                <span className="text-lg font-extrabold text-[#2D2620] block">12 Vehicles En Route</span>
              </div>
              <img src="/images/logistics_truck_kpi.png" alt="Truck" className="w-9 h-9 object-contain" />
            </div>

            <div className="space-y-2.5">
              {activeVehiclesList.map((veh, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-[#E6E1D5]/60 flex items-center justify-between hover:bg-[#FAF7F0]/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#2D2620]">{veh.number}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${veh.badgeClass}`}>{veh.status}</span>
                    </div>
                    <p className="text-[10px] text-[#666057] mt-0.5">Driver: {veh.driver} | {veh.route}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C8275]" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: Inventory, Shipment Tracking, AI Trust Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CARD 4: INVENTORY Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h2 className="text-base font-extrabold text-[#2D2620]">Inventory</h2>
              </div>
              <button 
                onClick={() => onSelectTab('inventory')}
                className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#666057] font-semibold">Total Central Stock</span>
                <span className="text-lg font-extrabold text-[#2D2620] block">7,850 Tonnes</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#666057] font-semibold">Total Stock Value</span>
                <span className="text-base font-extrabold text-[#556B2F] block">₹ 1,25,600</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {inventoryCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#2D2620]">{cat.category}</span>
                    <span className="text-[#666057]">{cat.qty} ({cat.pct}%)</span>
                  </div>
                  <div className="w-full bg-[#FAF7F0] h-2 rounded-full overflow-hidden border border-[#E6E1D5]/40">
                    <div className="bg-[#556B2F] h-full rounded-full" style={{ width: `${cat.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 5: SHIPMENT TRACKING Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <h2 className="text-base font-extrabold text-[#2D2620]">Shipment Tracking</h2>
              </div>
              <button 
                onClick={() => onSelectTab('shipment-tracking')}
                className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Active Shipment Live Status Banner */}
            <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-xs text-[#2D2620]">Shipment #SHP5678</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#556B2F]/15 text-[#556B2F]">In Transit</span>
              </div>
              <p className="text-[11px] text-[#666057]">Route: <strong className="text-[#2D2620]">Nashik → Pune</strong></p>
              <p className="text-[10px] text-[#8C8275] mt-0.5">ETA: 14 May, 2025 • Temperature: 4°C</p>
            </div>

            {/* Concise Milestone Progress */}
            <div className="space-y-2 pl-3 border-l-2 border-[#E6E1D5] relative">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#556B2F] -ml-[19px] bg-white" />
                <span className="font-bold text-[#2D2620]">Order Confirmed & Picked Up</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Truck className="w-3.5 h-3.5 text-[#2B6CB0] -ml-[19px] bg-white" />
                <span className="font-bold text-[#2B6CB0]">In Transit on NH-60</span>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-50">
                <div className="w-3 h-3 rounded-full border border-[#8C8275] -ml-[18px] bg-white" />
                <span className="font-semibold text-[#666057]">Out for Final Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 6: AI TRUST SCORE Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#556B2F]" />
                <h2 className="text-base font-extrabold text-[#2D2620]">AI Trust Score</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#556B2F]/15 text-[#556B2F]">Verified 🛡️</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F5E6] border border-[#E6E1D5] mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#666057] font-semibold">Network Verification Rating</span>
                <span className="text-2xl font-extrabold text-[#354424] block">98.4%</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#354424] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                A+
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F0]/60">
                <span className="text-[#666057]">Cold-Chain Integrity:</span>
                <span className="font-bold text-[#556B2F]">100% Compliant</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F0]/60">
                <span className="text-[#666057]">Supplier Quality Grade:</span>
                <span className="font-bold text-[#2D2620]">Grade A (Verified)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F0]/60">
                <span className="text-[#666057]">Dispute Risk Index:</span>
                <span className="font-bold text-[#556B2F]">Low Risk (0.2%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: TRACEABILITY Summary (Full Width Banner) */}
      <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#354424]" />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#2D2620]">Traceability & Provenance Pipeline 🔗</h2>
              <p className="text-xs text-[#666057]">End-to-end QR cryptographic batch verification</p>
            </div>
          </div>
          <button 
            onClick={() => onSelectTab('traceability')}
            className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Full Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5-Stage Node Journey Bar */}
        <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between overflow-x-auto gap-4 scrollbar-none">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-[#354424] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              🌱
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">1. Farm Harvest</p>
              <span className="text-[10px] text-[#556B2F] font-semibold">Patil Organic Farm</span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-[#354424] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              🌾
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">2. Mandi Inspection</p>
              <span className="text-[10px] text-[#556B2F] font-semibold">Grade A Verified</span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-[#354424] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              🏢
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">3. Cold Storage</p>
              <span className="text-[10px] text-[#556B2F] font-semibold">Nashik Silo (18°C)</span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-[#2B6CB0] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              🚚
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">4. Reefer Transport</p>
              <span className="text-[10px] text-[#2B6CB0] font-bold">In Transit (#SHP5678)</span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap opacity-60">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold">
              🏬
            </div>
            <div>
              <p className="text-xs font-bold text-[#666057]">5. Retail Dispatch</p>
              <span className="text-[10px] text-[#8C8275] font-semibold">Scheduled</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
