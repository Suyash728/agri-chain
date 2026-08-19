import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';

export const NotificationsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    { id: 1, title: "Order #ORD1256 Confirmed", desc: "FreshMart Supply Co. confirmed purchase of 800 kg grains.", time: "10 mins ago", icon: CheckCircle2, color: "text-[#3D5220]" },
    { id: 2, title: "AI Cold-Chain Audit Passed", desc: "Shipment #SHP5678 temperature maintained at 18.4°C.", time: "2 hours ago", icon: Truck, color: "text-[#B85C38]" },
    { id: 3, title: "Payment Deposited", desc: "₹ 12,450 successfully credited for Order #ORD1253.", time: "1 day ago", icon: CheckCircle2, color: "text-[#3D5220]" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#3D4E2A]" />
            <h3 className="text-base font-extrabold text-[#3B3028]">Notifications</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 flex flex-col gap-2.5">
          {notifications.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#3B3028]">{item.title}</h4>
                    <span className="text-[10px] text-[#786E65]">{item.time}</span>
                  </div>
                  <p className="text-xs text-[#786E65] mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
