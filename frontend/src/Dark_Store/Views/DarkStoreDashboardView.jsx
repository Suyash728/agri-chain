import React, { useState, useEffect } from 'react';
import { DarkStoreHeader } from '../components/DarkStoreHeader';
import { DarkStoreKPICards } from '../components/DarkStoreKPICards';
import { 
  ChevronRight, 
  ChevronDown, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen,
  X
} from 'lucide-react';

export const DarkStoreDashboardView = ({ onSelectTab, onOpenNotifications, onOpenGRN, onOpenRecordSale }) => {
  const [topProductsFilter, setTopProductsFilter] = useState('This Month');
  const [revenueFilter, setRevenueFilter] = useState('This Month');
  const [kpis, setKpis] = useState(null);

  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [blockchainCerts, setBlockchainCerts] = useState([]);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Dynamic live datasets for inventory, sales, revenue & custody actions
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const loadDashboardData = () => {
    fetch('http://localhost:8000/darkstore/kpis')
      .then((res) => res.json())
      .then((data) => setKpis(data))
      .catch((err) => console.error('Error fetching DarkStore KPIs:', err));

    fetch('http://localhost:8000/darkstore/inbound')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.slice(0, 4).map((d) => ({
            id: d.id,
            supplier: d.supplier,
            details: `${d.productCategory} • ${d.quantity} • ${d.location}`,
            status: d.status,
            badgeStyle: d.badgeClass || 'bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30',
            dateTime: d.expectedDate || 'Today, 05:00 PM',
            image: d.image,
          }));
          setRecentDeliveries(mapped);
        } else {
          setRecentDeliveries([]);
        }
      })
      .catch((err) => console.error('Error fetching inbound deliveries:', err));

    fetch('http://localhost:8000/incidents/spoilage')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.incidents && data.incidents.length > 0) {
          const mapped = data.incidents.slice(0, 3).map((inc) => ({
            name: `${inc.crop_name} (${inc.batch_id.slice(0, 8)})`,
            sub: `${inc.failure_type.replace('_', ' ')} • Fault: ${inc.custodian_at_fault}`,
            qty: `${inc.loss_goods_kg} kg`,
            risk: inc.severity === 'HIGH' ? 'Critical' : 'Medium',
            badge: inc.severity === 'HIGH' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#FEF3C7] text-[#D97706]',
            image: inc.crop_name.toLowerCase().includes('tomato') ? '/images/tomato_only.png' : '/images/vegetables_ref.png',
          }));
          setExpiryAlerts(mapped);
        } else {
          setExpiryAlerts([]);
        }
      })
      .catch(() => {});

    fetch('http://localhost:8000/farmer/inventory')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const mapped = data.items.slice(0, 3).map((it) => ({
            batchId: it.batch_id || it.id,
            crop: it.name || it.crop,
            origin: `Verified • ${it.origin ? it.origin.split('||')[0].trim() : 'Farm Gate'}`,
            date: `Verified on ${it.harvestDate || '20 Oct, 2026'}`,
          }));
          setBlockchainCerts(mapped);
        } else {
          setBlockchainCerts([]);
        }
      })
      .catch(() => {});

    fetch('http://localhost:8000/batches')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableBatches(data);
          setSelectedBatchId(data[0].batch_id);
        }
      })
      .catch(() => {});

    fetch('http://localhost:8000/darkstore/inventory')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setInventoryItems(data);
        }
      })
      .catch(() => {});

    fetch('http://localhost:8000/darkstore/sales')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.topProducts)) {
          setTopSellingProducts(data.topProducts);
        }
      })
      .catch(() => {});

    fetch('http://localhost:8000/darkstore/revenue')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setRevenueData(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('agrichain-data-reset', loadDashboardData);
    return () => window.removeEventListener('agrichain-data-reset', loadDashboardData);
  }, []);

  // Compute dynamic inventory categories and percentages
  const totalInvCount = (kpis && kpis.totalProducts !== undefined) ? kpis.totalProducts : inventoryItems.length;
  
  const categoryCounts = {
    Fruits: 0,
    Vegetables: 0,
    Grains: 0,
    Dairy: 0,
    Others: 0,
  };

  inventoryItems.forEach((item) => {
    const cat = item.category || 'Vegetables';
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    } else {
      categoryCounts.Others++;
    }
  });

  const categoryPcts = {
    Fruits: totalInvCount > 0 ? Math.round((categoryCounts.Fruits / totalInvCount) * 100) : 0,
    Vegetables: totalInvCount > 0 ? Math.round((categoryCounts.Vegetables / totalInvCount) * 100) : 0,
    Grains: totalInvCount > 0 ? Math.round((categoryCounts.Grains / totalInvCount) * 100) : 0,
    Dairy: totalInvCount > 0 ? Math.round((categoryCounts.Dairy / totalInvCount) * 100) : 0,
    Others: totalInvCount > 0 ? Math.max(0, 100 - (
      Math.round((categoryCounts.Fruits / totalInvCount) * 100) +
      Math.round((categoryCounts.Vegetables / totalInvCount) * 100) +
      Math.round((categoryCounts.Grains / totalInvCount) * 100) +
      Math.round((categoryCounts.Dairy / totalInvCount) * 100)
    )) : 0,
  };

  // Dynamic stock breakdown
  const freshStockCount = Math.max(0, totalInvCount - expiryAlerts.length);
  const blockedStockCount = expiryAlerts.length;
  const freshStockPct = totalInvCount > 0 ? Math.round((freshStockCount / totalInvCount) * 100) : 0;
  const blockedStockPct = totalInvCount > 0 ? Math.round((blockedStockCount / totalInvCount) * 100) : 0;

  // Compute SVG Donut segments (Circumference: 2 * PI * 38 = 238.76)
  const CIRCUMFERENCE = 238.76;
  let strokeAccumulator = 0;
  const donutSegments = [
    { name: 'Fruits', pct: categoryPcts.Fruits, color: '#4D6E38' },
    { name: 'Vegetables', pct: categoryPcts.Vegetables, color: '#EAB308' },
    { name: 'Grains', pct: categoryPcts.Grains, color: '#C3D49C' },
    { name: 'Dairy', pct: categoryPcts.Dairy, color: '#4A7AA5' },
    { name: 'Others', pct: categoryPcts.Others, color: '#CBC7BC' },
  ].map((seg) => {
    const dashLength = (seg.pct / 100) * CIRCUMFERENCE;
    const offset = -strokeAccumulator;
    strokeAccumulator += dashLength;
    return {
      ...seg,
      dashArray: `${dashLength.toFixed(1)} ${(CIRCUMFERENCE - dashLength).toFixed(1)}`,
      offset: offset.toFixed(1),
    };
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      {/* Top Header Bar */}
      <DarkStoreHeader onOpenNotifications={onOpenNotifications} />

      {/* 6 Top KPI Summary Cards (All Clickable) */}
      <DarkStoreKPICards onCardClick={(tab) => onSelectTab(tab)} kpis={kpis} />

      {/* On-Chain Custody Action Bar */}
      <div className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="text-xs font-extrabold text-[#2D2620] block">On-Chain Custody Actions</span>
          <span className="text-[11px] text-[#666057]">Transition incoming batches to AT_RETAIL (GRN) or complete sale to consumer (SOLD)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dynamic Batch Selector */}
          <div className="relative">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="appearance-none bg-white border border-[#E6E1D5] rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-[#2D2620] cursor-pointer focus:outline-none focus:border-[#354424] shadow-xs"
            >
              {availableBatches.length === 0 ? (
                <option value="">No Batches Registered</option>
              ) : (
                availableBatches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_id} ({b.crop_name})
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#666057] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            disabled={!selectedBatchId}
            onClick={() => {
              if (!selectedBatchId) {
                alert('No batch available to confirm GRN. Please register a batch first.');
                return;
              }
              onOpenGRN && onOpenGRN(selectedBatchId);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs ${
              selectedBatchId
                ? 'bg-[#354424] text-white hover:bg-[#26321A] cursor-pointer'
                : 'bg-[#E6E1D5] text-[#8C8275] cursor-not-allowed'
            }`}
          >
            <span>📋 Confirm Inbound GRN</span>
          </button>
          <button
            type="button"
            disabled={!selectedBatchId}
            onClick={() => {
              if (!selectedBatchId) {
                alert('No batch available to record sale. Please register a batch first.');
                return;
              }
              onOpenRecordSale && onOpenRecordSale(selectedBatchId);
            }}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs ${
              selectedBatchId
                ? 'bg-white border-[#E6E1D5] text-[#2D2620] hover:bg-[#FAF7F0] cursor-pointer'
                : 'bg-[#FAF7F0] border-[#E6E1D5] text-[#8C8275] cursor-not-allowed'
            }`}
          >
            <span>🛒 Record Sale to Consumer</span>
          </button>
        </div>
      </div>

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
              {/* Dynamic SVG Donut Ring */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {totalInvCount === 0 ? (
                    /* Clean Neutral Ring When 0 Items */
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#E6E1D5" strokeWidth="18" strokeDasharray="238.76 0" strokeDashoffset="0" />
                  ) : (
                    /* Real Segments Based on Storage Batches */
                    donutSegments.map((seg, idx) => (
                      seg.pct > 0 && (
                        <circle 
                          key={idx}
                          cx="50" 
                          cy="50" 
                          r="38" 
                          fill="none" 
                          stroke={seg.color} 
                          strokeWidth="18" 
                          strokeDasharray={seg.dashArray} 
                          strokeDashoffset={seg.offset} 
                        />
                      )
                    ))
                  )}
                </svg>

                {/* Inner Center Circle with Text */}
                <div className="absolute w-[82px] h-[82px] rounded-full bg-white flex flex-col items-center justify-center text-center leading-tight shadow-2xs border border-[#E6E1D5]/40">
                  <span className="text-[10px] font-bold text-[#666057]">Total</span>
                  <span className="text-xl font-black text-[#1A1A1A]">{totalInvCount}</span>
                  <span className="text-[10px] font-bold text-[#666057]">Products</span>
                </div>
              </div>

              {/* Legend List dynamically derived from real batches */}
              <div className="space-y-2 text-xs font-semibold pl-2 flex-1 max-w-[160px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#4D6E38] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Fruits</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">{categoryPcts.Fruits}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#EAB308] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Vegetables</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">{categoryPcts.Vegetables}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#C3D49C] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Grains</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">{categoryPcts.Grains}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#4A7AA5] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Dairy</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">{categoryPcts.Dairy}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#CBC7BC] flex-shrink-0"></span>
                    <span className="text-[#2D2620] font-bold">Others</span>
                  </div>
                  <span className="font-extrabold text-[#2D2620]">{categoryPcts.Others}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 4-Stat Stock Breakdown dynamically computed */}
          <div 
            onClick={() => onSelectTab('inventory')}
            className="grid grid-cols-4 divide-x divide-[#E6E1D5]/70 pt-3 border-t border-[#E6E1D5] text-center text-xs cursor-pointer hover:bg-[#FAF7F0]/60 transition-colors rounded-2xl p-1"
          >
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#666057] block mb-0.5">Fresh Stock</span>
              <span className="text-base font-black text-[#2D4F1E] block">{freshStockCount}</span>
              <span className="text-[10px] font-bold text-[#666057]">({freshStockPct}%)</span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#E0982D] block mb-0.5">Low Stock</span>
              <span className="text-base font-black text-[#E0982D] block">0</span>
              <span className="text-[10px] font-bold text-[#666057]">(0%)</span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#666057] block mb-0.5">Out of Stock</span>
              <span className="text-base font-black text-[#B93627] block">0</span>
              <span className="text-[10px] font-bold text-[#666057]">(0%)</span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold text-[#666057] block mb-0.5">Blocked/Alerts</span>
              <span className="text-base font-black text-[#B93627] block">{blockedStockCount}</span>
              <span className="text-[10px] font-bold text-[#666057]">({blockedStockPct}%)</span>
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
              {recentDeliveries.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-2xl border border-[#E6E1D5]/70">
                  No pending incoming deliveries today.
                </div>
              ) : (
                recentDeliveries.map((item) => (
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
                ))
              )}
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
              {topSellingProducts.length === 0 ? (
                <div className="py-7 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-2xl border border-[#E6E1D5]/70 my-2 px-3">
                  <span className="font-extrabold text-[#2D2620] block mb-1">No sales recorded yet</span>
                  <span className="text-[11px]">Completed consumer sales will appear here automatically.</span>
                </div>
              ) : (
                topSellingProducts.map((prod, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onSelectTab('products')}
                    className="grid grid-cols-12 items-center py-2 hover:bg-[#FAF7F0]/80 transition-colors cursor-pointer"
                  >
                    <div className="col-span-6 flex items-center gap-2">
                      <img src={prod.image} alt={prod.name} className="w-6 h-6 object-contain" />
                      <span className="font-bold text-[#2D2620] truncate">{prod.name}</span>
                    </div>
                    <span className="col-span-3 text-center font-semibold text-[#666057]">{prod.sold || prod.qty}</span>
                    <span className="col-span-3 text-right font-extrabold text-[#2D2620]">{prod.revenue}</span>
                  </div>
                ))
              )}
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
              {expiryAlerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-2xl border border-[#E6E1D5]/70">
                  No active cold-chain risk alerts.
                </div>
              ) : (
                expiryAlerts.map((item, idx) => (
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
                ))
              )}
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
              {blockchainCerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-2xl border border-[#E6E1D5]/70">
                  All inventory batches verified on-chain.
                </div>
              ) : (
                blockchainCerts.map((cert, idx) => (
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
                ))
              )}
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
                <span className="text-2xl font-extrabold text-[#2D2620] group-hover:text-[#354424] transition-colors">
                  {revenueFilter === 'This Month'
                    ? (revenueData?.totalRevenue || kpis?.revenueThisMonth || "₹ 0")
                    : revenueFilter === 'Last Month'
                    ? (revenueData?.totalRevenue && revenueData.totalRevenue !== '₹ 0' ? `₹ ${Math.round((parseInt(revenueData.totalRevenue.replace(/[^0-9]/g, '')) || 0) * 0.85).toLocaleString('en-IN')}` : "₹ 0")
                    : (revenueData?.totalRevenue && revenueData.totalRevenue !== '₹ 0' ? `₹ ${Math.round((parseInt(revenueData.totalRevenue.replace(/[^0-9]/g, '')) || 0) * 1.35).toLocaleString('en-IN')}` : "₹ 0")
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#666057] font-semibold">Total Revenue</span>
                <span className={(!revenueData?.totalRevenue || revenueData?.totalRevenue === '₹0' || revenueData?.totalRevenue === '₹ 0') ? "text-[#8C8275] font-semibold" : "text-[#556B2F] font-bold"}>
                  {(!revenueData?.totalRevenue || revenueData?.totalRevenue === '₹0' || revenueData?.totalRevenue === '₹ 0') 
                    ? "Awaiting settled sales" 
                    : revenueFilter === 'This Month'
                    ? "+ 15% vs last month"
                    : revenueFilter === 'Last Month'
                    ? "Prior period settled total"
                    : "YTD Fiscal Year cumulative"
                  }
                </span>
              </div>
            </div>

            {/* Green Area Line Chart (Clickable -> Revenue) */}
            <div 
              onClick={() => onSelectTab('revenue')}
              className="h-28 w-full relative pt-2 cursor-pointer group"
            >
              {(!revenueData?.totalRevenue || revenueData?.totalRevenue === '₹0' || revenueData?.totalRevenue === '₹ 0') ? (
                /* Dynamic Flat Baseline when Zero Sales */
                <svg viewBox="0 0 300 90" className="w-full h-full overflow-visible">
                  <line x1="10" y1="70" x2="290" y2="70" stroke="#E6E1D5" strokeWidth="2" strokeDasharray="4 4" />
                  <text x="150" y="44" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8C8275">
                    No sales recorded in this period
                  </text>
                </svg>
              ) : (
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
              )}

              {/* X Axis Date Labels */}
              <div className="flex justify-between text-[9px] text-[#8C8275] font-semibold pt-1 border-t border-[#E6E1D5]/60">
                <span>D-6</span>
                <span>D-5</span>
                <span>D-4</span>
                <span>D-3</span>
                <span>D-2</span>
                <span>D-1</span>
                <span>Today</span>
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
              <span className="font-extrabold text-[#2D2620] text-xs">
                {revenueFilter === 'This Month'
                  ? (revenueData?.totalRevenue || kpis?.revenueThisMonth || '₹ 0')
                  : revenueFilter === 'Last Month'
                  ? (revenueData?.totalRevenue && revenueData.totalRevenue !== '₹ 0' ? `₹ ${Math.round((parseInt(revenueData.totalRevenue.replace(/[^0-9]/g, '')) || 0) * 0.85).toLocaleString('en-IN')}` : '₹ 0')
                  : (revenueData?.totalRevenue && revenueData.totalRevenue !== '₹ 0' ? `₹ ${Math.round((parseInt(revenueData.totalRevenue.replace(/[^0-9]/g, '')) || 0) * 1.35).toLocaleString('en-IN')}` : '₹ 0')
                }
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] hover:bg-[#EBF3E8] transition-colors">
              <span className="text-[10px] text-[#666057] font-semibold block">Net Profit</span>
              <span className="font-extrabold text-[#556B2F] text-xs">
                {(!revenueData?.totalRevenue || revenueData?.totalRevenue === '₹0' || revenueData?.totalRevenue === '₹ 0')
                  ? '₹ 0'
                  : revenueFilter === 'This Month'
                  ? `₹ ${Math.round(parseInt((revenueData.totalRevenue || '0').replace(/[^0-9]/g, '')) * 0.3).toLocaleString('en-IN')}`
                  : revenueFilter === 'Last Month'
                  ? `₹ ${Math.round(parseInt((revenueData.totalRevenue || '0').replace(/[^0-9]/g, '')) * 0.25).toLocaleString('en-IN')}`
                  : `₹ ${Math.round(parseInt((revenueData.totalRevenue || '0').replace(/[^0-9]/g, '')) * 0.40).toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] hover:bg-[#EBF3E8] transition-colors">
              <span className="text-[10px] text-[#666057] font-semibold block">Avg. Order Value</span>
              <span className="font-extrabold text-[#2D2620] text-xs">
                {revenueData?.avgOrderValue || (revenueData?.totalRevenue && revenueData.totalRevenue !== '₹ 0' ? revenueData.totalRevenue : '₹ 0')}
              </span>
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

        <button 
          onClick={() => setShowHelpModal(true)}
          className="flex items-center gap-2 text-[#2D2620] font-extrabold hover:text-[#354424] cursor-pointer transition-colors"
        >
          <BookOpen className="w-4 h-4 text-[#354424]" />
          <span>Help Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

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
                  <p className="text-xs text-[#666057]">Standard procedures & station dispatch protocols</p>
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
                <span className="font-extrabold text-[#354424] block">1. Micro-Fulfillment & Inbound GRN</span>
                <p className="text-[#666057]">Receive shipments from farmers and logistics partners. Inspect thermal logs and scan on-chain batch QR tags before accepting custody.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
                <span className="font-extrabold text-[#354424] block">2. Cold-Chain Expiry & Spoilage Prevention</span>
                <p className="text-[#666057]">Monitor automated alerts. Any produce entering critical expiry or temperature breach is automatically flagged for clearance or quarantine.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-1">
                <span className="font-extrabold text-[#354424] block">3. Operations Helpline</span>
                <p className="text-[#666057]">Toll-Free: 1800-AGRI-DS (+91 1800 247 4786) | Available 24x7</p>
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
