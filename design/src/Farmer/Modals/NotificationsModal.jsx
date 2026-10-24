import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  ShoppingBag, 
  Package, 
  Inbox, 
  Check, 
  CheckCheck,
  Clock
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

export const NotificationsModal = ({ isOpen, onClose, role = 'farmer' }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'alerts'
  const [readIds, setReadIds] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');

  const storageKey = `agrichain_read_notifs_${role || 'all'}`;

  // Load read IDs from localStorage
  const loadReadIds = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (_) {
      return new Set();
    }
  }, [storageKey]);

  // Fetch notifications for the active role
  const fetchNotifs = useCallback(() => {
    if (!isOpen) return;
    setLoading(true);
    const targetRole = role || 'all';
    fetch(`${API_BASE_URL}/notifications/all-users?role=${targetRole}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((n) => {
            let IconComponent = ShieldCheck;
            let iconColor = 'text-[#354424]';
            let iconBg = 'bg-[#FAF7F0] border-[#E6E1D5]';

            if (n.icon === 'Truck') {
              IconComponent = Truck;
              iconColor = 'text-[#B85C38]';
              iconBg = 'bg-amber-50 border-amber-200';
            } else if (n.icon === 'CheckCircle2') {
              IconComponent = CheckCircle2;
              iconColor = 'text-emerald-700';
              iconBg = 'bg-emerald-50 border-emerald-200';
            } else if (n.icon === 'AlertTriangle' || n.icon === 'AlertCircle' || n.icon === 'ShieldAlert') {
              IconComponent = AlertTriangle;
              iconColor = 'text-rose-600';
              iconBg = 'bg-rose-50 border-rose-200';
            } else if (n.icon === 'Package') {
              IconComponent = Package;
              iconColor = 'text-[#354424]';
              iconBg = 'bg-[#EBF3E8] border-[#C5DCBD]';
            } else if (n.icon === 'ShoppingBag') {
              IconComponent = ShoppingBag;
              iconColor = 'text-purple-600';
              iconBg = 'bg-purple-50 border-purple-200';
            }

            const isAlert = 
              Boolean(n.loss_goods_kg || n.loss_money_inr || n.refund_inr) ||
              ['AI_BREACH_ALERT', 'FAILURE_LOSS', 'TELEMETRY_ALERT', 'STORAGE_ALERT', 'SAFETY_RECALL_REFUND', 'LIABILITY_PENALTY', 'SLA_BREACH'].includes(n.category) ||
              n.icon === 'AlertTriangle' || n.icon === 'AlertCircle';

            return {
              id: n.id,
              title: n.title,
              desc: n.desc,
              time: n.time || 'Recent',
              category: n.category || 'GENERAL',
              icon: IconComponent,
              iconColor,
              iconBg,
              isAlert,
              lossKg: n.loss_goods_kg,
              lossInr: n.loss_money_inr,
              refundInr: n.refund_inr,
            };
          });
          setNotifications(mapped);
        } else {
          setNotifications([]);
        }
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, role]);

  useEffect(() => {
    if (isOpen) {
      setReadIds(loadReadIds());
      fetchNotifs();
    }
  }, [isOpen, loadReadIds, fetchNotifs]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Mark all currently loaded items as read
  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const newSet = new Set(allIds);
    setReadIds(newSet);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('agrichain-notifications-read', { detail: { role } }));
    showToast('All notifications marked as read!');
  };

  // Toggle single item read state
  const handleToggleRead = (id) => {
    const next = new Set(readIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setReadIds(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('agrichain-notifications-read', { detail: { role } }));
  };

  // Filter items
  const filteredNotifs = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !readIds.has(n.id));
    }
    if (activeTab === 'alerts') {
      return notifications.filter((n) => n.isAlert);
    }
    return notifications;
  }, [notifications, activeTab, readIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const alertCount = useMemo(() => {
    return notifications.filter((n) => n.isAlert).length;
  }, [notifications]);

  if (!isOpen) return null;

  const ROLE_BADGES = {
    farmer: { label: '🌾 Farmer Node', color: 'bg-[#EBF3E8] text-[#354424] border-[#C5DCBD]' },
    logistics: { label: '🚛 SafeXpress Telematics', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    darkstore: { label: '🏬 Dark Store Operations', color: 'bg-sky-50 text-sky-900 border-sky-200' },
    consumer: { label: '🛒 Consumer Marketplace', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
    admin: { label: '⚡ Master Governance', color: 'bg-purple-50 text-purple-900 border-purple-200' },
    all: { label: '🌐 Universal Feed', color: 'bg-[#FAF7F0] text-[#2D2620] border-[#E6E1D5]' }
  };

  const badgeInfo = ROLE_BADGES[role] || ROLE_BADGES.all;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF7F0] border-b border-[#E6E1D5] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#354424] text-white flex items-center justify-center shadow-xs">
                <Bell className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2D2620] flex items-center gap-2 leading-tight">
                  <span>Live Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#354424] text-white text-[10px] font-black">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeInfo.color}`}>
                  {badgeInfo.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={fetchNotifs}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] transition-colors cursor-pointer"
                title="Refresh alerts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#354424]' : ''}`} />
              </button>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#E6E1D5] flex items-center justify-center text-[#666057] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Row & Tabs */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6E1D5]">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all' 
                    ? 'bg-[#354424] text-white shadow-2xs' 
                    : 'text-[#666057] hover:text-[#2D2620]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'unread' 
                    ? 'bg-[#354424] text-white shadow-2xs' 
                    : 'text-[#666057] hover:text-[#2D2620]'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeTab === 'unread' ? 'bg-white text-[#354424]' : 'bg-[#EBF3E8] text-[#354424]'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'alerts' 
                    ? 'bg-rose-600 text-white shadow-2xs' 
                    : 'text-[#666057] hover:text-rose-600'
                }`}
              >
                <span>Alerts</span>
                {alertCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeTab === 'alerts' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {alertCount}
                  </span>
                )}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E6E1D5] text-[11px] font-bold text-[#354424] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#354424]" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Mark read</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Toast Notice */}
        {toastMsg && (
          <div className="bg-[#EBF3E8] px-4 py-1.5 text-xs font-bold text-[#354424] flex items-center gap-1.5 border-b border-[#C5DCBD] animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* List Body */}
        <div className="p-3 sm:p-4 flex flex-col gap-2.5 overflow-y-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#666057]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#354424]" />
              <span className="text-xs font-semibold">Synchronizing live portal notifications...</span>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] mb-3">
                <Inbox className="w-7 h-7 text-[#666057]" />
              </div>
              <h4 className="text-sm font-black text-[#2D2620]">
                {activeTab === 'unread' ? 'No Unread Notifications' : activeTab === 'alerts' ? 'No Critical Alerts' : 'No Notifications'}
              </h4>
              <p className="text-xs text-[#666057] mt-1.5 max-w-xs leading-relaxed">
                {activeTab === 'unread' 
                  ? 'All live alerts for this portal have been marked as read. Check the "All" tab for complete activity history.'
                  : 'On-chain custody transitions, cold-chain breaches, and harvest arrivals will appear here in real-time.'}
              </p>
              <button
                onClick={fetchNotifs}
                className="mt-4 px-4 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#EBF3E8] border border-[#E6E1D5] text-xs font-bold text-[#354424] transition-colors cursor-pointer"
              >
                Refresh Feed
              </button>
            </div>
          ) : (
            filteredNotifs.map((item) => {
              const Icon = item.icon;
              const isUnread = !readIds.has(item.id);

              return (
                <div 
                  key={item.id}
                  onClick={() => handleToggleRead(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                    isUnread
                      ? 'bg-white border-[#354424] shadow-xs border-l-[5px] border-l-[#354424]'
                      : 'bg-[#FAF7F0]/60 border-[#E6E1D5] hover:bg-[#FAF7F0] opacity-90'
                  }`}
                  title={isUnread ? 'Click to mark as read' : 'Click to mark as unread'}
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${item.iconBg}`}>
                    <Icon className={`w-4.5 h-4.5 ${item.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className={`text-xs truncate ${isUnread ? 'font-black text-[#2D2620]' : 'font-extrabold text-[#554E44]'}`}>
                          {item.title}
                        </h4>
                        {isUnread && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#354424] text-white text-[9px] font-black flex-shrink-0 tracking-wider">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-[#8C8275] flex-shrink-0 whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-xs text-[#666057] mt-1 leading-relaxed">
                      {item.desc}
                    </p>

                    {/* Metric / Impact Pills */}
                    {(item.lossKg !== undefined || item.lossInr !== undefined || item.refundInr !== undefined || item.isAlert) && (
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {item.lossKg !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-black border border-red-200">
                            📦 {item.lossKg} kg Degraded
                          </span>
                        )}
                        {item.lossInr !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-200">
                            💸 -₹{item.lossInr.toLocaleString('en-IN')} Loss
                          </span>
                        )}
                        {item.refundInr !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                            ✓ ₹{item.refundInr.toLocaleString('en-IN')} Refunded
                          </span>
                        )}
                        {item.isAlert && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                            🛡️ Safety Audit Flagged
                          </span>
                        )}
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
