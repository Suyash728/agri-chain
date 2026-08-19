import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Clock, CheckCircle2, QrCode, Bike, ArrowRight } from 'lucide-react';

export const FulfillmentOrdersView = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('All');

  const orders = [
    { orderId: 'PK-4021', buyer: 'Blinkit Dark Store #08', item: 'Organic Tomatoes (Grade A)', qty: '120 kg', bin: 'Bin A-04 (Cold)', sla: '12 mins left', status: 'Picking', rider: 'Rider #14 Assigned' },
    { orderId: 'PK-4022', buyer: 'Zepto Micro Hub #12', item: 'Fresh Potatoes (5kg Bags)', qty: '200 kg', bin: 'Bin B-12 (Ambient)', sla: '18 mins left', status: 'Packing', rider: 'Rider #08 Assigned' },
    { orderId: 'PK-4023', buyer: 'Swiggy Instamart #03', item: 'Green Gram / Moong Dal', qty: '85 kg', bin: 'Bin C-02 (Silo)', sla: '25 mins left', status: 'Quality Checked', rider: 'Staged for Pickup' },
    { orderId: 'PK-4024', buyer: 'Local Retail Mart', item: 'Nashik Red Onions', qty: '350 kg', bin: 'Bin B-01 (Ambient)', sla: '45 mins left', status: 'Dispatched', rider: 'En Route to Delivery' },
  ];

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
        {filteredOrders.map(ord => (
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
              <button className="px-3 py-1.5 rounded-xl bg-[#354424] text-white font-extrabold text-xs cursor-pointer hover:bg-[#26321A]">
                Print Packing QR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
