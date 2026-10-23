import React, { useState, useEffect, useCallback } from 'react';
import { X, Bell, Package, ShieldCheck, Tag, AlertTriangle, RefreshCw, CheckCircle2, Truck, Inbox, Check } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

export const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const markAllRead = useCallback((itemsToMark) => {
    try {
      const targetItems = itemsToMark || notifications;
      const ids = targetItems.map((n) => n.id);
      localStorage.setItem('agrichain_read_notifs_consumer', JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent('agrichain-notifications-read', { detail: { role: 'consumer' } }));
    } catch (_) {}
  }, [notifications]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/notifications/all-users?role=consumer`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch consumer alerts');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const items = data.map((n) => {
            let IconComponent = ShieldCheck;
            let bg = 'bg-[#FAF7F0] text-[#2D2620]';

            if (n.icon === 'Truck') {
              IconComponent = Truck;
              bg = 'bg-[#FAF7F0] text-[#B85C38]';
            } else if (n.icon === 'CheckCircle2') {
              IconComponent = CheckCircle2;
              bg = 'bg-emerald-100 text-[#354424]';
            } else if (n.icon === 'AlertCircle' || n.icon === 'AlertTriangle') {
              IconComponent = AlertTriangle;
              bg = 'bg-rose-100 text-rose-700';
            } else if (n.icon === 'Package') {
              IconComponent = Package;
              bg = 'bg-[#EBF3E8] text-[#354424]';
            } else if (n.category === 'SAFETY_RECALL_REFUND') {
              IconComponent = ShieldCheck;
              bg = 'bg-emerald-100 text-emerald-800';
            }

            return {
              id: n.id,
              title: n.title,
              desc: n.desc,
              time: n.time || 'Recent',
              icon: IconComponent,
              bg,
              refundInr: n.refund_inr,
              lossKg: n.loss_goods_kg,
              isRecall: n.category === 'SAFETY_RECALL_REFUND',
            };
          });
          setNotifications(items);
          markAllRead(items);
        } else {
          setNotifications([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load consumer notifications:', err);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, markAllRead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm sm:max-w-md p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4 max-h-[85vh]">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#354424]" />
            <span>Notifications {notifications.length > 0 && `(${notifications.length})`}</span>
          </h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button 
                onClick={() => markAllRead(notifications)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-[#354424] bg-white border border-[#E6E1D5] hover:bg-[#FAF7F0] transition-colors cursor-pointer flex items-center gap-1"
                title="Mark all as read"
              >
                <Check className="w-3 h-3 text-[#354424]" />
                <span>Mark read</span>
              </button>
            )}
            <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 overflow-y-auto">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#666057]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#556B2F]" />
              <span className="text-xs font-semibold">Loading consumer alerts...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#EBF3E8] border border-[#E6E1D5] flex items-center justify-center text-[#354424] mb-3">
                <Inbox className="w-6 h-6 text-[#354424]" />
              </div>
              <h4 className="font-extrabold text-sm text-[#2D2620]">No Notifications</h4>
              <p className="text-xs text-[#666057] mt-1 max-w-xs leading-relaxed">
                Cold-chain quality updates, harvest batch deliveries, and refunds will appear here dynamically.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="bg-white p-3.5 rounded-2xl border border-[#E6E1D5] shadow-xs flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.bg}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-xs text-[#2D2620]">{n.title}</h4>
                      <span className="text-[10px] text-[#666057]">{n.time}</span>
                    </div>
                    <p className="text-[11px] font-medium text-[#666057] leading-snug">{n.desc}</p>
                    {n.isRecall && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          ✓ 100% Refund (₹{n.refundInr?.toLocaleString('en-IN')})
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black">
                          🛡️ Health Safety Protection
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
