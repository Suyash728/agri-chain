import React, { useState, useEffect } from 'react';
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

const resolveCropIcon = (cropName = '', icon = '') => {
  if (icon && !icon.includes('wheat_only.png')) return icon;
  const cn = (cropName || '').toLowerCase();
  if (cn.includes('tomato')) return '/images/tomato_only.png';
  if (cn.includes('potato')) return '/images/potato_only.png';
  if (cn.includes('mango')) return '/images/mango_only.png';
  if (cn.includes('banana')) return '/images/banana_only.png';
  if (cn.includes('apple')) return '/images/apple.png';
  if (cn.includes('turmeric')) return '/images/turmeric_only.png';
  if (cn.includes('chilli') || cn.includes('chili')) return '/images/chilli_only.png';
  if (cn.includes('wheat') || cn.includes('sharbati')) return '/images/wheat_only.png';
  if (cn.includes('rice') || cn.includes('basmati')) return '/images/rice_only.png';
  if (cn.includes('chickpea')) return '/images/chickpea_only.png';
  if (cn.includes('moong') || cn.includes('gram')) return '/images/greengram_only.png';
  if (cn.includes('toor')) return '/images/toor_dal.png';
  if (cn.includes('cashew')) return '/images/cashew_only.png';
  if (cn.includes('almond')) return '/images/almond_only.png';
  if (cn.includes('fruit') || cn.includes('orange') || cn.includes('strawberr')) return '/images/fruits_ref.png';
  if (cn.includes('spice')) return '/images/spices_ref.png';
  if (cn.includes('pulse')) return '/images/pulses_ref.png';
  if (cn.includes('grain')) return '/images/grains_ref.png';
  return icon || '/images/vegetables_ref.png';
};

export const LogisticDashboardView = ({ onSelectTab, onOpenNotifications }) => {
  const [procurementFilter, setProcurementFilter] = useState('All');
  const [availableProduce, setAvailableProduce] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [activeVehiclesList, setActiveVehiclesList] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [aiTrustData, setAiTrustData] = useState(null);

  const loadDashboardData = () => {
    fetch('http://localhost:8000/logistics/available-produce')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((p) => ({
            name: p.crop || p.name,
            icon: resolveCropIcon(p.crop || p.name, p.icon),
            qty: p.qty || p.quantity || '500 kg',
            price: p.price || '₹ 2,000',
            status: p.status || 'In Stock',
            badge: p.badge || 'bg-[#556B2F]/15 text-[#556B2F]',
          }));
          setAvailableProduce(mapped);
        } else {
          setAvailableProduce([]);
        }
      })
      .catch(() => setAvailableProduce([]));

    fetch('http://localhost:8000/logistics/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mappedOrders = data.map((o) => ({
            ...o,
            supplier: (o.supplier || '').replace(/\|\|.*?\)/, ')').trim(),
          }));
          setProcurementOrders(mappedOrders);
        } else {
          setProcurementOrders([]);
        }
      })
      .catch(() => setProcurementOrders([]));

    fetch('http://localhost:8000/logistics/shipments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mappedVehicles = data.map((s) => ({
            batchId: s.batchId,
            number: s.number,
            status: s.status,
            badgeClass: s.badge,
            driver: s.driver,
            temp: s.temp,
            route: `${(s.from || '').split('||')[0].trim()} → ${(s.to || '').split('||')[0].trim()}`,
          }));
          setActiveVehiclesList(mappedVehicles);
        } else {
          setActiveVehiclesList([]);
        }
      })
      .catch(() => setActiveVehiclesList([]));

    fetch('http://localhost:8000/farmer/inventory')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.summary) {
          setStockSummary(data.summary);
        }
      })
      .catch(() => {});

    fetch('http://localhost:8000/logistics/category-allocations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInventoryCategories(data.map(c => ({
            category: c.name,
            qty: c.qty,
            pct: c.pct
          })));
        } else {
          setInventoryCategories([]);
        }
      })
      .catch(() => setInventoryCategories([]));

    fetch('http://localhost:8000/farmer/ai-trust')
      .then((res) => res.json())
      .then((data) => setAiTrustData(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('agrichain-data-reset', loadDashboardData);
    window.addEventListener('agrichain-data-updated', loadDashboardData);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadDashboardData);
      window.removeEventListener('agrichain-data-updated', loadDashboardData);
    };
  }, []);

  const filteredOrders = procurementFilter === 'All' 
    ? procurementOrders 
    : procurementOrders.filter((o) => {
        if (procurementFilter === 'Pending') return o.status === 'Pending' || o.status === 'Ready for Pickup';
        if (procurementFilter === 'Confirmed') return o.status === 'Confirmed';
        if (procurementFilter === 'In Progress') return o.status === 'In Progress' || o.status === 'In Transit';
        return o.status === procurementFilter;
      });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. TOP HEADER & ALL 4 KPI SUMMARY CARDS (100% UNCHANGED) */}
      <LogisticHeader onOpenNotifications={onOpenNotifications} />
      <LogisticKPICards onCardClick={onSelectTab} />

      {/* ============================================================== */}
      {/* 2. LOWER DASHBOARD SUMMARY SECTION (REDESIGNED & CONCISE)      */}
      {/* ============================================================== */}
      
      {/* ROW 1: Available Produce, Procurement / Orders, Transportation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* CARD 1: AVAILABLE PRODUCE Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between">
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

            <div className="space-y-2">
              {availableProduce.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-xl border border-[#E6E1D5]/60">
                  No registered produce lots waiting for pickup.
                </div>
              ) : (
                availableProduce.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F0]/60 border border-[#E6E1D5]/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={resolveCropIcon(item.name, item.icon)} alt={item.name} className="w-6 h-6 object-contain flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-[#2D2620] truncate">{item.name}</h4>
                        <span className="text-[10px] text-[#666057]">{item.qty}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="font-extrabold text-xs text-[#556B2F] block">{item.price}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.badge}`}>{item.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: PROCUREMENT / ORDERS Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between">
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
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Pending', 'Confirmed', 'In Progress'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProcurementFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    procurementFilter === tab ? 'bg-[#354424] text-white shadow-xs' : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]/60 hover:text-[#2D2620]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredOrders.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-xl border border-[#E6E1D5]/60">
                  No orders matching '{procurementFilter}'.
                </div>
              ) : (
                filteredOrders.slice(0, 4).map((order, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#FAF7F0]/60 border border-[#E6E1D5]/60 flex items-center justify-between hover:bg-[#FAF7F0] transition-colors">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#2D2620] truncate">{order.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${order.badgeClass}`}>{order.status}</span>
                      </div>
                      <p className="text-[11px] text-[#666057] mt-0.5 truncate">{order.supplier}</p>
                      <p className="text-[10px] text-[#8C8275] truncate">{order.produce}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CARD 3: TRANSPORTATION Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between">
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
                <span className="text-lg font-extrabold text-[#2D2620] block">
                  {activeVehiclesList.length > 0 ? `${activeVehiclesList.length} Vehicles En Route` : '0 Active Vehicles'}
                </span>
              </div>
              <img src="/images/logistics_truck_kpi.png" alt="Truck" className="w-9 h-9 object-contain" />
            </div>

            <div className="space-y-2">
              {activeVehiclesList.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-xl border border-[#E6E1D5]/60">
                  No active fleet dispatches in transit.
                </div>
              ) : (
                activeVehiclesList.slice(0, 4).map((veh, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#FAF7F0]/60 border border-[#E6E1D5]/60 flex items-center justify-between hover:bg-[#FAF7F0] transition-colors">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#2D2620]">{veh.number}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${veh.badgeClass}`}>{veh.status}</span>
                      </div>
                      <p className="text-[10px] text-[#666057] mt-0.5 truncate">Driver: {veh.driver} | {veh.route}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: Inventory, Shipment Tracking, AI Trust Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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
                <span className="text-lg font-extrabold text-[#2D2620] block">
                  {stockSummary ? `${stockSummary.totalVolume} ${stockSummary.volumeUnit}` : '0.00 Tonnes'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#666057] font-semibold">Total Stock Value</span>
                <span className="text-base font-extrabold text-[#556B2F] block">
                  {stockSummary ? stockSummary.totalValue : '₹ 0'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {inventoryCategories.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-center text-xs text-[#666057]">
                  No warehouse category allocations recorded.
                </div>
              ) : (
                inventoryCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#2D2620]">{cat.category}</span>
                      <span className="text-[#666057]">{cat.qty} ({cat.pct}%)</span>
                    </div>
                    <div className="w-full bg-[#FAF7F0] h-2 rounded-full overflow-hidden border border-[#E6E1D5]/40">
                      <div className="bg-[#556B2F] h-full rounded-full" style={{ width: `${cat.pct}%` }}></div>
                    </div>
                  </div>
                ))
              )}
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
            {activeVehiclesList.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] mb-3 text-center text-xs text-[#666057]">
                No active shipments currently en route.
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-[#2D2620]">
                    Shipment #{activeVehiclesList[0].batchId || activeVehiclesList[0].number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#556B2F]/15 text-[#556B2F]">
                    {activeVehiclesList[0].status}
                  </span>
                </div>
                <p className="text-[11px] text-[#666057]">
                  Route: <strong className="text-[#2D2620]">{activeVehiclesList[0].route}</strong>
                </p>
                <p className="text-[10px] text-[#8C8275] mt-0.5">
                  Vehicle: {activeVehiclesList[0].number} ({activeVehiclesList[0].driver}) • Temp: {activeVehiclesList[0].temp || '4.5°C'}
                </p>
              </div>
            )}

            {/* Concise Milestone Progress */}
            <div className="space-y-2 pl-3 border-l-2 border-[#E6E1D5] relative">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#556B2F] -ml-[19px] bg-white" />
                <span className="font-bold text-[#2D2620]">Order Confirmed & Picked Up</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Truck className={`w-3.5 h-3.5 -ml-[19px] bg-white ${activeVehiclesList.length > 0 ? 'text-[#2B6CB0]' : 'text-[#8C8275]'}`} />
                <span className={`font-bold ${activeVehiclesList.length > 0 ? 'text-[#2B6CB0]' : 'text-[#8C8275]'}`}>
                  {activeVehiclesList.length > 0 ? 'In Transit on Highway Corridor' : 'Awaiting Transit Dispatch'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-50">
                <div className="w-3 h-3 rounded-full border border-[#8C8275] -ml-[18px] bg-white" />
                <span className="font-semibold text-[#666057]">Out for Final Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 6: AI TRUST SCORE Summary */}
        <div 
          onClick={() => onSelectTab && onSelectTab('ai-trust')}
          className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#7A8B52] transition-all cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#556B2F]" />
                <h2 className="text-base font-extrabold text-[#2D2620] group-hover:text-[#556B2F] transition-colors">AI Trust Score</h2>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${aiTrustData?.score > 0 ? 'bg-[#556B2F]/15 text-[#556B2F]' : 'bg-amber-100 text-amber-900'}`}>
                {aiTrustData?.level || (aiTrustData?.score > 0 ? 'Verified 🛡️' : 'Awaiting Telemetry')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F5E6] border border-[#E6E1D5] mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#666057] font-semibold">Network Verification Rating</span>
                <span className="text-2xl font-extrabold text-[#354424] block">
                  {aiTrustData?.score !== undefined ? `${aiTrustData.score}%` : '0%'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#354424] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                {aiTrustData?.score > 80 ? 'A+' : aiTrustData?.score > 50 ? 'B' : 'N/A'}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F0]/60">
                <span className="text-[#666057]">Cold-Chain Integrity:</span>
                <span className="font-bold text-[#556B2F]">{aiTrustData?.aiVerificationDetails?.[0]?.status || 'Awaiting Telemetry'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F0]/60">
                <span className="text-[#666057]">Fleet GPS Validation:</span>
                <span className="font-bold text-[#2D2620]">{aiTrustData?.aiVerificationDetails?.[1]?.status || 'Route Verified'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F0]/60">
                <span className="text-[#666057]">Smart Seal & Tamper:</span>
                <span className="font-bold text-[#556B2F]">{aiTrustData?.aiVerificationDetails?.[2]?.status || 'Smart Seal Intact'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E6E1D5] flex items-center justify-between text-xs font-bold text-[#354424] group-hover:text-[#26321A]">
            <span>View Live Fleet Telematics</span>
            <span>→</span>
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${activeVehiclesList.length > 0 ? 'bg-[#354424] text-white' : 'bg-gray-200 text-gray-700'}`}>
              🌱
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">1. Farm Harvest</p>
              <span className="text-[10px] text-[#556B2F] font-semibold">
                {activeVehiclesList.length > 0 ? (activeVehiclesList[0].route.split('→')[0].trim() || 'Verified Farm') : 'Awaiting Harvest'}
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${activeVehiclesList.length > 0 ? 'bg-[#354424] text-white' : 'bg-gray-200 text-gray-700'}`}>
              🌾
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">2. Mandi Inspection</p>
              <span className="text-[10px] text-[#556B2F] font-semibold">
                {activeVehiclesList.length > 0 ? 'Grade A Verified' : 'Standard Gate Inspection'}
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${activeVehiclesList.length > 0 ? 'bg-[#354424] text-white' : 'bg-gray-200 text-gray-700'}`}>
              🏢
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">3. Cold Storage</p>
              <span className="text-[10px] text-[#556B2F] font-semibold">
                {activeVehiclesList.length > 0 ? 'Bay Allocated' : 'Capacity Available'}
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${activeVehiclesList.length > 0 ? 'bg-[#2B6CB0] text-white' : 'bg-gray-200 text-gray-700'}`}>
              🚚
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D2620]">4. Reefer Transport</p>
              <span className={`text-[10px] font-bold ${activeVehiclesList.length > 0 ? 'text-[#2B6CB0]' : 'text-[#8C8275]'}`}>
                {activeVehiclesList.length > 0 ? `In Transit (#${activeVehiclesList[0].batchId || activeVehiclesList[0].number})` : 'Awaiting Dispatch'}
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#8C8275] flex-shrink-0" />

          <div className="flex items-center gap-3 whitespace-nowrap opacity-60">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold">
              🏬
            </div>
            <div>
              <p className="text-xs font-bold text-[#666057]">5. Retail Dispatch</p>
              <span className="text-[10px] text-[#8C8275] font-semibold">
                {activeVehiclesList.length > 0 ? 'En Route to Dark Store' : 'Scheduled'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
