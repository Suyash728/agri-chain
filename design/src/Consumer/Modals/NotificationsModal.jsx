import React, { useState, useEffect } from 'react';
import { X, Bell, Package, ShieldCheck, Tag, AlertTriangle, RefreshCw } from 'lucide-react';

export const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('http://localhost:8000/notifications/all-users?role=consumer')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch consumer alerts');
        return res.json();
      })
      .then((data) => {
        const items = [];

        // 1. Spoilage & Quality Recall notices
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((n) => {
            items.push({
              id: n.id,
              title: n.title,
              desc: n.desc,
              time: n.time || 'Today',
              icon: ShieldCheck,
              bg: 'bg-emerald-100 text-emerald-800',
              refundInr: n.refund_inr,
              lossKg: n.loss_goods_kg,
              isRecall: true,
            });
          });
        }

        // 2. Default order status notices
        items.push(
          {
            id: 'n1',
            title: 'Order Out for Delivery',
            desc: 'Order #ORD1256 is out for delivery by Nashik Central Dark Store courier.',
            time: '10 mins ago',
            icon: Package,
            bg: 'bg-[#EBF3E8] text-[#354424]',
          },
          {
            id: 'n2',
            title: 'Blockchain Verification Passed',
            desc: 'Organic Tomato Batch #TM1256 record verified on AgriChain network.',
            time: '2 hours ago',
            icon: ShieldCheck,
            bg: 'bg-[#EBF3FA] text-[#2B6CB0]',
          },
          {
            id: 'n3',
            title: 'Special Promo Offer',
            desc: 'Use promo code FRESH20 for 20% off on your next fresh produce order.',
            time: '1 day ago',
            icon: Tag,
            bg: 'bg-[#FDF3E7] text-[#B85C38]',
          }
        );

        setNotifications(items);
      })
      .catch((err) => {
        void err;
        setNotifications([
          {
            id: 'n1',
            title: 'Order Out for Delivery',
            desc: 'Order #ORD1256 is out for delivery by Nashik Central Dark Store courier.',
            time: '10 mins ago',
            icon: Package,
            bg: 'bg-[#EBF3E8] text-[#354424]',
          },
          {
            id: 'n2',
            title: 'Blockchain Verification Passed',
            desc: 'Organic Tomato Batch #TM1256 record verified on AgriChain network.',
            time: '2 hours ago',
            icon: ShieldCheck,
            bg: 'bg-[#EBF3FA] text-[#2B6CB0]',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm sm:max-w-md p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4 max-h-[85vh]">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#354424]" />
            <span>Notifications ({notifications.length})</span>
          </h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 overflow-y-auto">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#666057]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#556B2F]" />
              <span className="text-xs font-semibold">Loading consumer alerts...</span>
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
