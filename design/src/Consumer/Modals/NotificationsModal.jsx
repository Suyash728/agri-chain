import React from 'react';
import { X, Bell, Package, ShieldCheck, Tag } from 'lucide-react';

export const NotificationsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      title: 'Order Out for Delivery',
      desc: 'Order #ORD1256 is out for delivery by Nashik Central Dark Store courier.',
      time: '10 mins ago',
      icon: Package,
      bg: 'bg-[#EBF3E8] text-[#354424]'
    },
    {
      id: 'n2',
      title: 'Blockchain Verification Passed',
      desc: 'Organic Tomato Batch #TM1256 record verified on AgriChain network.',
      time: '2 hours ago',
      icon: ShieldCheck,
      bg: 'bg-[#EBF3FA] text-[#2B6CB0]'
    },
    {
      id: 'n3',
      title: 'Special Promo Offer',
      desc: 'Use promo code FRESH20 for 20% off on your next fresh produce order.',
      time: '1 day ago',
      icon: Tag,
      bg: 'bg-[#FDF3E7] text-[#B85C38]'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm sm:max-w-md p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#354424]" />
            <span>Notifications (3)</span>
          </h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {notifications.map((n) => {
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
