import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export const OrdersView = ({ onBack, onSelectOrder }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchOrders = () => {
    fetch('http://localhost:8000/farmer/orders')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) setOrders(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmOrder = async (ord) => {
    const targetId = ord.batchId || ord.id;
    try {
      setConfirmingId(targetId);
      const res = await fetch(`http://localhost:8000/farmer/orders/${targetId}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => (o.batchId === targetId || o.id === targetId) ? { ...o, status: 'Confirmed', statusType: 'confirmed' } : o));
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to confirm order:', err);
    } finally {
      setConfirmingId(null);
    }
  };

  // Deduplicate orders by unique batchId or id so every order appears exactly once
  const uniqueOrders = useMemo(() => {
    const seen = new Set();
    return orders.filter(order => {
      const key = order.batchId || order.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [orders]);

  const filteredOrders = uniqueOrders.filter(order => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return order.status === 'Pending';
    if (activeTab === 'Confirmed') return order.status === 'Confirmed';
    if (activeTab === 'Completed') return order.status === 'Completed';
    return false;
  });

  const getBadgeStyle = (status) => {
    if (status === 'Confirmed') return 'badge-confirmed';
    if (status === 'Completed') return 'badge-completed';
    if (status === 'Pending') return 'badge-pending';
    return 'badge-confirmed';
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E1D5] shadow-xs w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#3B3028]">
            Orders / Requests
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6E1D5] gap-4 px-2">
        {['All', 'Pending', 'Confirmed', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === tab 
                ? 'text-[#3D4E2A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#3D4E2A]' 
                : 'text-[#786E65] hover:text-[#3B3028]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Order Cards List with Warm Cream Background */}
      <div className="flex flex-col gap-3.5 w-full">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E6E1D5] text-sm text-[#666057] font-semibold">
            No orders found matching '{activeTab}'.
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div 
              key={ord.id}
              onClick={() => onSelectOrder && onSelectOrder(ord)}
              style={{ backgroundColor: '#FAF7F0' }}
              className="border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-[#7A8B52] transition-all duration-200 w-full"
            >
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-extrabold text-[#3B3028]">
                  {ord.id}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getBadgeStyle(ord.status)}`}>
                  {ord.status}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-[#786E65]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#3B3028]">Buyer:</span>
                  <span className="font-extrabold text-[#3B3028]">{ord.buyer}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#3B3028]">Items:</span>
                  <span className="font-extrabold text-[#3B3028] text-right">{ord.items}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#3B3028]">Date:</span>
                  <span className="font-semibold text-[#3B3028]">{ord.date}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#E8E2D5]/60 mt-1">
                  <span className="font-bold text-[#3B3028]">Total Amount:</span>
                  <span className="font-extrabold text-[#2E3A1F] text-sm sm:text-base">{ord.totalAmount}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {ord.status === 'Pending' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmOrder(ord);
                    }}
                    disabled={confirmingId === (ord.batchId || ord.id)}
                    className="px-4 py-1.5 bg-[#3D4E2A] hover:bg-[#2A371B] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{confirmingId === (ord.batchId || ord.id) ? 'Confirming...' : 'Accept Order'}</span>
                  </button>
                ) : (
                  <div />
                )}
                <ChevronRight className="w-5 h-5 text-[#3B3028]" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* View All Orders Action Button */}
      <div className="mt-2">
        <button 
          onClick={() => setActiveTab('All')}
          className="w-full py-4 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>View All Orders</span>
        </button>
      </div>
    </div>
  );
};
