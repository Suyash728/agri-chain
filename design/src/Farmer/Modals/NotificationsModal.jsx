import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Truck, RefreshCw, ShieldAlert, ShoppingBag } from 'lucide-react';

export const NotificationsModal = ({ isOpen, onClose, role = 'farmer' }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.allSettled([
      fetch(`http://localhost:8000/notifications/all-users?role=${role}`).then((r) => r.json()),
      fetch('http://localhost:8000/farmer/activity').then((r) => r.json())
    ])
      .then(([allUsersRes, actRes]) => {
        const items = [];

        // 1. Spoilage failure & financial loss notifications from backend
        if (allUsersRes.status === 'fulfilled' && Array.isArray(allUsersRes.value)) {
          allUsersRes.value.forEach((n) => {
            let IconComponent = AlertTriangle;
            if (n.icon === 'Truck') IconComponent = Truck;
            else if (n.icon === 'ShieldCheck') IconComponent = CheckCircle2;
            else if (n.icon === 'AlertCircle') IconComponent = ShieldAlert;

            items.push({
              id: n.id,
              title: n.title,
              desc: n.desc,
              time: n.time || 'Recent',
              icon: IconComponent,
              color: n.color || 'text-red-600',
              bgColor: n.bgColor || 'bg-red-50 border-red-200',
              lossKg: n.loss_goods_kg,
              lossInr: n.loss_money_inr,
              isFailureLoss: true,
            });
          });
        }

        // 2. Real activity milestones
        if (actRes.status === 'fulfilled' && Array.isArray(actRes.value)) {
          actRes.value.slice(0, 4).forEach((act) => {
            let Icon = CheckCircle2;
            let color = 'text-[#3D5220]';
            let bg = 'bg-[#FAF7F0] border-[#E6E1D5]';

            if (act.type === 'shipment') {
              Icon = Truck;
              color = 'text-[#B85C38]';
            } else if (act.type === 'payment') {
              Icon = CheckCircle2;
              color = 'text-[#3D5220]';
            }

            items.push({
              id: act.id,
              title: act.title,
              desc: `${act.status} • ${act.amount || 'Custody logged on-chain'}`,
              time: act.date || 'Today',
              icon: Icon,
              color: color,
              bgColor: bg
            });
          });
        }

        if (items.length > 0) {
          setNotifications(items);
        } else {
          setNotifications([
            { id: 'def-1', title: "Order Confirmed", desc: "Batch #TM1256 purchased by Retailer.", time: "10 mins ago", icon: CheckCircle2, color: "text-[#3D5220]", bgColor: 'bg-[#FAF7F0] border-[#E6E1D5]' },
            { id: 'def-2', title: "AI Cold-Chain Audit Passed", desc: "Shipment #SHP5678 temperature maintained at 4.2°C.", time: "2 hours ago", icon: Truck, color: "text-[#B85C38]", bgColor: 'bg-[#FAF7F0] border-[#E6E1D5]' }
          ]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load notifications:', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, role]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#3D4E2A]" />
            <h3 className="text-base font-extrabold text-[#3B3028]">Live System Notifications</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 flex flex-col gap-2.5 overflow-y-auto">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#666057]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#556B2F]" />
              <span className="text-xs font-semibold">Loading live alerts...</span>
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={`p-3 rounded-2xl border flex items-start gap-3 ${item.bgColor}`}>
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-[#3B3028]">{item.title}</h4>
                      <span className="text-[10px] text-[#786E65]">{item.time}</span>
                    </div>
                    <p className="text-xs text-[#786E65] mt-0.5 leading-snug">{item.desc}</p>
                    {item.lossKg !== undefined && item.lossInr !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-black">
                          📦 {item.lossKg} kg Spoiled
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                          💸 -₹{item.lossInr.toLocaleString('en-IN')} Loss
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

