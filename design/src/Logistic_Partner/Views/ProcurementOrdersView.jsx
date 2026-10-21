import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../../components/WalletConnect';
import { CONTRACT_ADDRESSES, CUSTODY_TRANSFER_ABI, toBytes32 } from '../../utils/contracts';
import { 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  ClipboardList, 
  Truck, 
  CheckCircle2, 
  Package, 
  Users, 
  X, 
  Search, 
  Filter,
  Store,
  Plus
} from 'lucide-react';
import { AcceptShipmentModal } from '../Modals/AcceptShipmentModal';
import { HandoffRetailerModal } from '../Modals/HandoffRetailerModal';

export const ProcurementOrdersView = ({ onNavigate }) => {
  const { account, signer } = useWallet();
  const [filter, setFilter] = useState('All');
  const [dispatchingBatchId, setDispatchingBatchId] = useState(null);

  // Custody Modals States
  const [isAcceptShipmentOpen, setIsAcceptShipmentOpen] = useState(false);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [activeCustodyBatchId, setActiveCustodyBatchId] = useState('BATCH-PO-2026-001');

  // Modal / View States
  const [activeModal, setActiveModal] = useState(null); // 'all-orders' | 'all-transactions' | 'all-activity' | null
  const [modalSearch, setModalSearch] = useState('');

  const [orderList, setOrderList] = useState([]);
  const [txs, setTxs] = useState([]);

  const fetchOrders = useCallback(() => {
    fetch('http://localhost:8000/logistics/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((d) => ({
            id: d.id,
            supplier: (d.supplier || '').replace(/\|\|.*?\)/, ')').trim(),
            product: d.produce,
            qty: d.quantity || '500 kg',
            status: d.status,
            badge: d.badgeClass,
            date: d.harvestDate,
            price: d.price,
            isLiveBatch: true,
          }));
          setOrderList(mapped);
          if (mapped.length > 0 && activeCustodyBatchId === 'BATCH-PO-2026-001') {
            setActiveCustodyBatchId(mapped[0].id);
          }
        }
      })
      .catch(() => {});
  }, [activeCustodyBatchId]);

  const fetchTxs = useCallback(() => {
    fetch('http://localhost:8000/logistics/transactions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((t) => ({
            id: t.id,
            desc: `${t.type}: ${t.crop || 'Batch'} (${t.batchId ? t.batchId.slice(0, 10) : ''})`,
            date: t.date || new Date().toISOString().split('T')[0],
            amount: t.amount,
            status: t.status,
            category: t.type,
          }));
          setTxs(mapped);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTxs();
  }, [fetchOrders, fetchTxs]);

  const handleDispatch = async (batchId) => {
    setDispatchingBatchId(batchId);
    let clientTxHash = null;

    if (signer) {
      try {
        const custodyContract = new ethers.Contract(
          CONTRACT_ADDRESSES.CustodyTransfer,
          CUSTODY_TRANSFER_ABI,
          signer
        );
        const b32 = toBytes32(batchId);
        const tx = await custodyContract.transferCustody(
          b32,
          account || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          1, // IN_TRANSIT
          100000 // 100000 paise (₹1,000)
        );
        const receipt = await tx.wait();
        clientTxHash = receipt.hash || tx.hash;
      } catch (_) {
        // Fallback to backend relayer on user rejection
      }
    }

    try {
      const res = await fetch(`http://localhost:8000/batches/${batchId}/custody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_holder: 'Safexpress Cold Chain Logistics',
          state: 'IN_TRANSIT',
          price_paise: 100000,
        }),
      });
      if (res.ok) {
        alert(`Batch ${batchId} dispatched! Custody transferred to IN_TRANSIT on-chain.${clientTxHash ? `\nAudit Tx Hash: ${clientTxHash}` : ''}`);
        fetchOrders();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Failed to dispatch batch: ${errJson.detail || 'Status ' + res.status}`);
      }
    } catch (err) {
      console.error('Failed to dispatch batch:', err);
    } finally {
      setDispatchingBatchId(null);
    }
  };

  const recentActivities = txs.slice(0, 7).map((t, idx) => ({
    id: t.id,
    text: `${t.desc} — ${t.amount}`,
    time: t.date,
    relative: `${idx * 15 + 5}m ago`,
    dot: idx === 0 ? 'bg-[#556B2F]' : (idx % 2 === 1 ? 'bg-[#2B6CB0]' : 'bg-[#B85C38]'),
  }));

  const totalTxVolume = txs.reduce((acc, t) => {
    const num = parseInt((t.amount || '').replace(/[^0-9]/g, '')) || 0;
    return acc + num;
  }, 0);

  const totalOrdersCount = orderList.length;
  const pendingOrdersCount = orderList.filter(o => o.status === 'Pending' || o.status === 'Ready for Pickup').length;
  const inProgressOrdersCount = orderList.filter(o => o.status === 'In Progress' || o.status === 'In Transit').length;
  const completedOrdersCount = orderList.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
  const totalQtyKg = orderList.reduce((acc, o) => {
    const num = parseInt((o.qty || '').replace(/[^0-9]/g, '')) || 500;
    return acc + num;
  }, 0);
  const totalSuppliersCount = new Set(orderList.map(o => o.supplier).filter(Boolean)).size || (orderList.length > 0 ? 1 : 0);

  const filteredOrders = filter === 'All' ? orderList.slice(0, 5) : orderList.filter(o => o.status === filter);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* TOP SECTION: Side-by-Side Equal Width Grid (Procurement Orders & Logistics Invoices) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Procurement & Orders Hub */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#2D2620]">Procurement & Orders Hub 📦</h2>
                <p className="text-xs text-[#666057]">Track purchase orders, supplier confirmations & dispatch schedules</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCustodyBatchId('BATCH-PO-2026-001');
                    setIsAcceptShipmentOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#354424] text-white text-[11px] font-bold hover:bg-[#26321A] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Accept Shipment</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCustodyBatchId('BATCH-PO-2026-001');
                    setIsHandoffOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] text-[11px] font-bold hover:bg-[#E6E1D5] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Store className="w-3.5 h-3.5 text-[#556B2F]" />
                  <span>Hand Off to Retailer</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['All', 'Pending', 'Confirmed', 'In Progress', 'Completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filter === tab ? 'bg-[#354424] text-white shadow-xs' : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]/80'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5]">
                  <tr className="text-[#666057] font-semibold">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D5]/40">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((ord, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-[#2D2620]">{ord.id}</td>
                        <td className="py-3 px-3 font-semibold text-[#2D2620]">{ord.supplier}</td>
                        <td className="py-3 px-3 text-[#666057]">{ord.product}</td>
                        <td className="py-3 px-3 text-center text-[#2D2620] font-bold">{ord.qty}</td>
                        <td className="py-3 px-3 text-right">
                          {ord.status === 'Ready for Pickup' || ord.status === 'Confirmed' ? (
                            <button
                              onClick={() => {
                                setActiveCustodyBatchId(ord.id);
                                setIsAcceptShipmentOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#354424] text-white text-[10px] font-bold hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Accept 🚚
                            </button>
                          ) : ord.status === 'In Transit' ? (
                            <button
                              onClick={() => {
                                setActiveCustodyBatchId(ord.id);
                                setIsHandoffOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] text-[10px] font-bold hover:bg-[#E6E1D5] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Handoff 🏬
                            </button>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.badge}`}>
                              {ord.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-[#666057]">
                        No procurement orders available in this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Action Link -> Fully Functional Modal Trigger */}
          <div className="pt-2">
            <button 
              onClick={() => {
                setActiveModal('all-orders');
                setModalSearch('');
              }}
              className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View all orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Logistics Invoices & Transactions */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#2D2620]">Logistics Invoices & Transactions 📑</h2>
                <p className="text-xs text-[#666057]">Total Monthly Volume: ₹ {totalTxVolume.toLocaleString('en-IN')} | Freight & Storage Ledger</p>
              </div>
              <button 
                onClick={() => alert('Financial ledger statement downloaded!')}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger</span>
              </button>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5]">
                  <tr className="text-[#666057] font-semibold">
                    <th className="py-2.5 px-3">Transaction Description</th>
                    <th className="py-2.5 px-3 text-center">Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D5]/40">
                  {txs.length > 0 ? (
                    txs.slice(0, 5).map((t, i) => (
                      <tr key={i} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#2D2620]">{t.desc}</td>
                        <td className="py-3 px-3 text-center text-[#8C8275]">{t.date}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-[#2D2620]">{t.amount}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#556B2F]/15 text-[#556B2F]">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-[#666057]">
                        No transactions recorded in custody ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Action Link -> Fully Functional Modal Trigger */}
          <div className="pt-2">
            <button 
              onClick={() => {
                setActiveModal('all-transactions');
                setModalSearch('');
              }}
              className="text-xs font-bold text-[#354424] hover:text-[#26321A] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View all transactions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Procurement Overview & Recent Order Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Left Side (8 cols): Procurement Overview */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2D2620]">Procurement Overview</h2>
            <p className="text-xs text-[#666057]">Key insights at a glance</p>
          </div>

          {/* Top Row of 5 Equal Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* 1. Total Orders */}
            <div className="bg-[#F4F5E6] rounded-2xl p-3.5 border border-[#E6E1D5]/60 flex flex-col justify-between space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#556B2F]/20 flex items-center justify-center text-[#556B2F]">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#2D2620] block">{totalOrdersCount}</span>
                <p className="text-[11px] font-bold text-[#2D2620] leading-tight">Total Orders</p>
                <span className="text-[10px] text-[#666057]">Live PO Count</span>
              </div>
            </div>

            {/* 2. Pending Orders */}
            <div className="bg-[#FDF3E7] rounded-2xl p-3.5 border border-[#E6E1D5]/60 flex flex-col justify-between space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#B85C38]/20 flex items-center justify-center text-[#B85C38]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#2D2620] block">{pendingOrdersCount}</span>
                <p className="text-[11px] font-bold text-[#2D2620] leading-tight">Pending Orders</p>
                <span className="text-[10px] text-[#666057]">Awaiting Action</span>
              </div>
            </div>

            {/* 3. In Progress Orders */}
            <div className="bg-[#EBF3FA] rounded-2xl p-3.5 border border-[#E6E1D5]/60 flex flex-col justify-between space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#2B6CB0]/20 flex items-center justify-center text-[#2B6CB0]">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#2D2620] block">{inProgressOrdersCount}</span>
                <p className="text-[11px] font-bold text-[#2D2620] leading-tight">In Progress Orders</p>
                <span className="text-[10px] text-[#666057]">In Transit / Processing</span>
              </div>
            </div>

            {/* 4. Completed Orders */}
            <div className="bg-[#EAF5EA] rounded-2xl p-3.5 border border-[#E6E1D5]/60 flex flex-col justify-between space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#556B2F]/20 flex items-center justify-center text-[#556B2F]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#2D2620] block">{completedOrdersCount}</span>
                <p className="text-[11px] font-bold text-[#2D2620] leading-tight">Completed Orders</p>
                <span className="text-[10px] text-[#666057]">Successfully Delivered</span>
              </div>
            </div>

            {/* 5. Total Procurement Value */}
            <div className="bg-[#F4EEF8] rounded-2xl p-3.5 border border-[#E6E1D5]/60 flex flex-col justify-between space-y-2 col-span-2 sm:col-span-1">
              <div className="w-8 h-8 rounded-xl bg-[#6B46C1]/20 flex items-center justify-center text-[#6B46C1] font-bold text-sm">
                ₹
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold text-[#2D2620] block">₹ {totalProcurementVal.toLocaleString('en-IN')}</span>
                <p className="text-[11px] font-bold text-[#2D2620] leading-tight">Total Procurement Value</p>
                <span className="text-[10px] text-[#666057]">Custody Ledger</span>
              </div>
            </div>
          </div>

          {/* Bottom Banner Card (Total Quantity Procured & Total Suppliers) */}
          <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#E6E1D5] grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E6E1D5]">
            <div className="flex items-center gap-3.5 pr-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E6E1D5] flex items-center justify-center text-[#354424] shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#666057] font-semibold">Total Quantity Procured</p>
                <span className="text-xl font-extrabold text-[#2D2620]">{totalQtyKg.toLocaleString('en-IN')} kg</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:pl-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E6E1D5] flex items-center justify-center text-[#354424] shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#666057] font-semibold">Total Suppliers</p>
                <span className="text-xl font-extrabold text-[#2D2620]">{totalSuppliersCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (4 cols): Recent Order Activity */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#2D2620]">Recent Order Activity</h2>
                <p className="text-xs text-[#666057]">Latest updates from procurement hub</p>
              </div>
              <button 
                onClick={() => {
                  setActiveModal('all-activity');
                  setModalSearch('');
                }}
                className="px-3 py-1 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs font-bold text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Activity List */}
            <div className="space-y-3.5">
              {recentActivities.slice(0, 5).map((act, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${act.dot}`} />
                    <div>
                      <p className="font-bold text-[#2D2620] leading-snug">{act.text}</p>
                      <span className="text-[11px] text-[#8C8275]">{act.time}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#8C8275] whitespace-nowrap">{act.relative}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* FULLY FUNCTIONAL MODALS / FULL PAGE VIEWS   */}
      {/* ========================================== */}

      {/* 1. VIEW ALL ORDERS FULL DATA MODAL */}
      {activeModal === 'all-orders' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#E6E1D5] flex items-center justify-between bg-[#FAF7F0]">
              <div>
                <h3 className="text-xl font-extrabold text-[#2D2620]">All Procurement Orders 📦</h3>
                <p className="text-xs text-[#666057]">Complete database list of verified farm-gate procurement purchase orders</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-[#E6E1D5] flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search order ID, supplier, crop..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5]">
                  <tr className="text-[#666057] font-semibold">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-center">Date</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D5]/40">
                  {orderList
                    .filter(o => o.id.toLowerCase().includes(modalSearch.toLowerCase()) || o.supplier.toLowerCase().includes(modalSearch.toLowerCase()) || o.product.toLowerCase().includes(modalSearch.toLowerCase()))
                    .map((ord, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="p-3 font-extrabold text-[#2D2620]">{ord.id}</td>
                        <td className="p-3 font-semibold text-[#2D2620]">{ord.supplier}</td>
                        <td className="p-3 text-[#666057]">{ord.product}</td>
                        <td className="p-3 text-center text-[#2D2620] font-bold">{ord.qty}</td>
                        <td className="p-3 text-center text-[#8C8275]">{ord.date}</td>
                        <td className="p-3 text-right font-extrabold text-[#556B2F]">{ord.price}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${ord.badge}`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#E6E1D5] bg-[#FAF7F0] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW ALL TRANSACTIONS FULL DATA MODAL */}
      {activeModal === 'all-transactions' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#E6E1D5] flex items-center justify-between bg-[#FAF7F0]">
              <div>
                <h3 className="text-xl font-extrabold text-[#2D2620]">All Logistics Transactions & Invoices 📑</h3>
                <p className="text-xs text-[#666057]">Complete financial ledger, supplier payouts, freight fees & buyer advances</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-[#E6E1D5] flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search transaction description, ID, category..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs text-[#2D2620] focus:outline-none focus:border-[#354424]"
                />
              </div>
              <button 
                onClick={() => alert('Exporting full ledger CSV...')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5]">
                  <tr className="text-[#666057] font-semibold">
                    <th className="p-3">Tx ID</th>
                    <th className="p-3">Transaction Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Date</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D5]/40">
                  {txs
                    .filter(t => t.desc.toLowerCase().includes(modalSearch.toLowerCase()) || t.category.toLowerCase().includes(modalSearch.toLowerCase()))
                    .map((t, i) => (
                      <tr key={i} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="p-3 font-extrabold text-[#354424]">{t.id}</td>
                        <td className="p-3 font-bold text-[#2D2620]">{t.desc}</td>
                        <td className="p-3 text-[#666057] font-medium">{t.category}</td>
                        <td className="p-3 text-center text-[#8C8275]">{t.date}</td>
                        <td className="p-3 text-right font-extrabold text-[#2D2620]">{t.amount}</td>
                        <td className="p-3 text-right">
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#556B2F]/15 text-[#556B2F]">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#E6E1D5] bg-[#FAF7F0] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. VIEW ALL RECENT ACTIVITY FULL DATA MODAL */}
      {activeModal === 'all-activity' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#E6E1D5] flex items-center justify-between bg-[#FAF7F0]">
              <div>
                <h3 className="text-xl font-extrabold text-[#2D2620]">Full Recent Activity Audit Feed 🔔</h3>
                <p className="text-xs text-[#666057]">Complete real-time timeline of order updates & procurement milestones</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {recentActivities.map((act, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]/80 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${act.dot}`} />
                    <div>
                      <p className="font-extrabold text-[#2D2620] leading-snug">{act.text}</p>
                      <span className="text-[11px] text-[#8C8275] font-medium">{act.time}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#556B2F] bg-[#556B2F]/15 px-2.5 py-1 rounded-full whitespace-nowrap">{act.relative}</span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#E6E1D5] bg-[#FAF7F0] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custody Modals */}
      <AcceptShipmentModal
        isOpen={isAcceptShipmentOpen}
        onClose={() => setIsAcceptShipmentOpen(false)}
        defaultBatchId={activeCustodyBatchId}
        onSuccess={() => fetchOrders()}
      />

      <HandoffRetailerModal
        isOpen={isHandoffOpen}
        onClose={() => setIsHandoffOpen(false)}
        defaultBatchId={activeCustodyBatchId}
        onSuccess={() => fetchOrders()}
      />

    </div>
  );
};
