import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Truck, RefreshCw, ShieldAlert, ShoppingBag, Inbox } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

export const NotificationsModal = ({ isOpen, onClose, role = 'farmer' }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const fetchPromises = [
      fetch(`${API_BASE_URL}/notifications/all-users?role=${role}`).then((r) => r.json())
    ];

    if (role === 'farmer') {
      fetchPromises.push(fetch(`${API_BASE_URL}/farmer/activity`).then((r) => r.json()));
    }

    Promise.allSettled(fetchPromises)
      .then(([allUsersRes, actRes]) => {
        const items = [];

        // 1. Spoilage failure & financial loss notifications from backend
        if (allUsersRes.status === 'fulfilled' && Array.isArray(allUsersRes.value)) {
          allUsersRes.value.forEach((n) => {
            let IconComponent = AlertTriangle;
            if (n.icon === 'Truck') IconComponent = Truck;
            else if (n.icon === 'ShieldCheck' || n.icon === 'CheckCircle2') IconComponent = CheckCircle2;
            else if (n.icon === 'AlertCircle' || n.icon === 'ShieldAlert') IconComponent = ShieldAlert;
            else if (n.icon === 'ShoppingBag') IconComponent = ShoppingBag;

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
              isFailureLoss: Boolean(n.loss_goods_kg || n.loss_money_inr),
            });
          });
        }

        // 2. Real activity milestones (only for farmer role)
        if (actRes && actRes.status === 'fulfilled' && Array.isArray(actRes.value)) {
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

        setNotifications(items);
      })
      .catch(() => {
        setNotifications([]);
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
            <h3 className="text-base font-extrabold text-[#3B3028]">
              Live System Notifications {notifications.length > 0 && `(${notifications.length})`}
            </h3>
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
          ) : notifications.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#786E65] mb-3">
                <Inbox className="w-6 h-6 text-[#786E65]" />
              </div>
              <h4 className="text-sm font-bold text-[#3B3028]">No Notifications</h4>
              <p className="text-xs text-[#786E65] mt-1 max-w-xs leading-relaxed">
                Live cold-chain telemetry breaches, custody transfers, and system alerts will appear here as produce moves through the supply chain.
              </p>
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
