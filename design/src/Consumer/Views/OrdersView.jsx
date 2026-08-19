import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { initialOrders } from '../data/consumerData';

export const OrdersView = ({ onViewOrderDetails }) => {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterTabs = ['All', 'Delivered', 'In Transit', 'Cancelled'];

  const filteredOrders = initialOrders.filter(order => {
    if (selectedFilter === 'All') return true;
    return order.status.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="text-lg md:text-xl font-black text-[#2D2620]">My Orders</h2>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {filterTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === tab
                    ? 'bg-[#354424] text-white shadow-xs'
                    : 'bg-white border border-[#E6E1D5] text-[#666057] hover:text-[#2D2620]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Order Cards: Mobile 1-col, Desktop 2-col */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              onClick={() => onViewOrderDetails && onViewOrderDetails(order)}
              className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-3 cursor-pointer hover:border-[#354424] hover:shadow-md transition-all"
            >
              {/* Order Header Row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-[#2D2620]">{order.id}</span>
                  <span className="text-[11px] font-semibold text-[#666057]">• {order.date}</span>
                </div>
                <span className={`px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold ${order.statusBg}`}>
                  {order.status}
                </span>
              </div>

              {/* Thumbnails Row */}
              <div className="flex items-center gap-2 my-1">
                {order.thumbnails.map((img, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-xl bg-[#F8F5EE] p-1.5 flex items-center justify-center border border-[#E6E1D5] overflow-hidden">
                    <img src={img} alt="item" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>
                ))}
                {order.itemsCount > order.thumbnails.length && (
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] flex items-center justify-center text-xs font-extrabold text-[#666057] border border-[#E6E1D5]">
                    +{order.itemsCount - order.thumbnails.length}
                  </div>
                )}
              </div>

              {/* Order Footer Row */}
              <div className="flex justify-between items-center pt-2 border-t border-[#F4F5E6]">
                <span className="text-xs sm:text-sm font-bold text-[#2D2620]">
                  Total: <span className="text-sm sm:text-base font-extrabold text-[#354424]">₹ {order.total}</span>
                </span>
                <div className="flex items-center gap-1 text-xs font-extrabold text-[#354424]">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
