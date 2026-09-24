import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Truck, RefreshCw, ShieldAlert, ShoppingBag } from 'lucide-react';

export const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.allSettled([
      fetch('http://localhost:8000/telemetry/quarantine').then((r) => r.json()),
      fetch('http://localhost:8000/farmer/activity').then((r) => r.json())
    ])
      .then(([quarantineRes, actRes]) => {
        const items = [];

        // 1. Quarantine alerts (high priority warnings)
        if (quarantineRes.status === 'fulfilled' && Array.isArray(quarantineRes.value)) {
          quarantineRes.value.slice(0, 3).forEach((q) => {
            items.push({
              id: `q-${q.id}`,
              title: `AI Quarantine: ${q.cropName || 'Batch'} Alert`,
              desc: `Batch #${q.batchId} intercepted: ${q.reasons?.join(', ') || 'Thermal policy violation'}.`,
              time: q.quarantinedAt || 'Recent',
              icon: AlertTriangle,
              color: 'text-red-600',
              bgColor: 'bg-red-50 border-red-200'
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
  }, [isOpen]);

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
                    <p className="text-xs text-[#786E65] mt-0.5">{item.desc}</p>
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

