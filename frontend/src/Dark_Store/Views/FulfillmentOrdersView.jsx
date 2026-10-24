import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Clock, CheckCircle2, QrCode, Bike, ArrowRight, Package } from 'lucide-react';

export const FulfillmentOrdersView = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);

  const loadFulfillmentData = () => {
    Promise.all([
      fetch('http://localhost:8000/darkstore/inventory').then(r => r.json()).catch(() => []),
      fetch('http://localhost:8000/darkstore/sales').then(r => r.json()).catch(() => ({ recentOrders: [] }))
    ]).then(([inventory, sales]) => {
      const liveOrders = [];
      if (Array.isArray(inventory) && inventory.length > 0) {
        inventory.forEach((inv, idx) => {
          liveOrders.push({
            orderId: `PK-${inv.batchId ? inv.batchId.slice(-4) : (4000 + idx)}`,
            buyer: idx % 2 === 0 ? 'Blinkit Quick Hub #04' : 'Zepto Dark Store #12',
            item: inv.item,
            qty: inv.stock || '50 kg',
            bin: `${inv.binId} (${inv.bay})`,
            sla: `${10 + (idx * 5)} mins left`,
            status: idx === 0 ? 'Picking' : 'Packing',
            rider: `Rider #${10 + idx} Assigned`
          });
        });
      }
      if (sales && Array.isArray(sales.recentOrders)) {
        sales.recentOrders.slice(0, 4).forEach((so, idx) => {
          liveOrders.push({
            orderId: so.id || `PK-${4100 + idx}`,
            buyer: so.customer || 'Direct Consumer Delivery',
            item: so.product,
            qty: so.quantity || '25 kg',
            bin: 'Fulfilled / Bay Dispatched',
            sla: 'Completed',
            status: 'Dispatched',
            rider: 'Delivered to Destination'
          });
        });
      }
      setOrders(liveOrders);
    });
  };

  useEffect(() => {
    loadFulfillmentData();
    window.addEventListener('agrichain-data-reset', loadFulfillmentData);
    window.addEventListener('agrichain-data-updated', loadFulfillmentData);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadFulfillmentData);
      window.removeEventListener('agrichain-data-updated', loadFulfillmentData);
    };
  }, []);

  const filteredOrders = orders.filter(ord => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Picking') return ord.status === 'Picking' || ord.status === 'Packing';
    if (activeTab === 'Checked') return ord.status === 'Quality Checked';
    if (activeTab === 'Dispatched') return ord.status === 'Dispatched';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">
              Order Fulfillment (Pick & Pack)
            </h1>
            <p className="text-xs text-[#666057]">Live Quick-Commerce & B2B picking queue, SLA timers & barcode verification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Picking', 'Checked', 'Dispatched'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                activeTab === tab
                  ? 'bg-[#1E293B] text-white'
                  : 'bg-[#FAF7F0] text-[#666057] border border-[#E6E1D5]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(ord => (
            <div key={ord.orderId} className="bg-white rounded-3xl p-5 border border-[#E6E1D5] shadow-xs hover:border-[#7A8B52] transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base text-[#2D2620] block">{ord.orderId}</span>
                    <span className="text-[11px] text-[#666057] font-semibold">{ord.buyer}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {ord.sla}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#666057] font-semibold">Ordered Item</span>
                  <span className="font-extrabold text-[#2D2620]">{ord.item}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666057] font-semibold">Net Quantity</span>
                  <span className="font-extrabold text-[#354424]">{ord.qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666057] font-semibold">Picking Location</span>
                  <span className="font-extrabold text-[#2563EB]">{ord.bin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666057] font-semibold">Fulfillment Status</span>
                  <span className="font-extrabold text-[#354424]">{ord.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6E1D5]">
                <span className="text-[#666057] flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-[#556B2F]" /> {ord.rider}</span>
                <button 
                  onClick={() => alert(`Packing QR Slip generated for Order ${ord.orderId}:\nItem: ${ord.item}\nLocation: ${ord.bin}\nQuantity: ${ord.qty}\nStatus: ${ord.status}\nAssigned: ${ord.rider}`)}
                  className="px-3 py-1.5 rounded-xl bg-[#354424] text-white font-extrabold text-xs cursor-pointer hover:bg-[#26321A]"
                >
                  Print Packing QR
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-3xl border border-[#E6E1D5] text-center text-[#666057]">
            <Package className="w-8 h-8 mx-auto mb-2 text-[#8C8275] opacity-50" />
            <p className="font-extrabold text-sm text-[#2D2620]">No fulfillment orders in this status</p>
            <p className="text-xs mt-1">Orders appear here when darkstore micro-inventory is allocated for customer deliveries.</p>
          </div>
        )}
      </div>
    </div>
  );
};
