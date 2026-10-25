import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Bell } from 'lucide-react';
import { useNotificationCount } from './utils/useNotificationCount';
import { Sidebar as FarmerSidebar } from './Farmer/components/Sidebar';
import { BottomNav as FarmerBottomNav } from './Farmer/components/BottomNav';
import { Header as FarmerHeader } from './Farmer/components/Header';
import { KPICards as FarmerKPICards } from './Farmer/components/KPICards';
import { CropOverview as FarmerCropOverview } from './Farmer/components/CropOverview';
import { RecentActivity as FarmerRecentActivity } from './Farmer/components/RecentActivity';

// Farmer Views
import { MyCropsView } from './Farmer/Views/MyCropsView';
import { CropDetailsView } from './Farmer/Views/CropDetailsView';
import { InventoryView as FarmerInventoryView } from './Farmer/Views/InventoryView';
import { OrdersView as FarmerOrdersView } from './Farmer/Views/OrdersView';
import { ShipmentsView as FarmerShipmentsView } from './Farmer/Views/ShipmentsView';
import { TraceabilityView as FarmerTraceabilityView } from './Farmer/Views/TraceabilityView';
import { AITrustView } from './Farmer/Views/AITrustView';
import { FarmerQualityView } from './Farmer/Views/FarmerQualityView';
import { EarningsView } from './Farmer/Views/EarningsView';
import { ProfileView as FarmerProfileView } from './Farmer/Views/ProfileView';

// Farmer Modals
import { MoreMenuSheet } from './Farmer/Modals/MoreMenuSheet';
import { AddStockModal } from './Farmer/Modals/AddStockModal';
import { ViewJourneyModal } from './Farmer/Modals/ViewJourneyModal';
import { NotificationsModal } from './Farmer/Modals/NotificationsModal';

// Logistics Partner Components & Views
import { LogisticSidebar } from './Logistic_Partner/components/LogisticSidebar';
import { LogisticBottomNav } from './Logistic_Partner/components/LogisticBottomNav';
import { LogisticDashboardView } from './Logistic_Partner/Views/LogisticDashboardView';
import { AvailableProduceView } from './Logistic_Partner/Views/AvailableProduceView';
import { ProcurementOrdersView } from './Logistic_Partner/Views/ProcurementOrdersView';
import { TransportationView } from './Logistic_Partner/Views/TransportationView';
import { StorageView } from './Logistic_Partner/Views/StorageView';
import { ShipmentTrackingView } from './Logistic_Partner/Views/ShipmentTrackingView';
import { TraceabilityView as LogisticTraceabilityView } from './Logistic_Partner/Views/TraceabilityView';
import { InventoryView as LogisticInventoryView } from './Logistic_Partner/Views/InventoryView';
import { TransactionsView } from './Logistic_Partner/Views/TransactionsView';
import { LogisticProfileView } from './Logistic_Partner/Views/LogisticProfileView';
import { LogisticAITrustView } from './Logistic_Partner/Views/LogisticAITrustView';

// Dark Store Portal
import { DarkStoreApp } from './Dark_Store/DarkStoreApp';

// Consumer Portal
import { ConsumerApp } from './Consumer/ConsumerApp';

// Admin Portal
import { AdminPortalView } from './components/AdminPortalView';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminBottomNav } from './components/AdminBottomNav';

// Web3 Wallet
import { WalletProvider, WalletConnect } from './components/WalletConnect';

// Showcase & Demo Lab
import { ShowcaseDrawer } from './components/ShowcaseDrawer';
import { PresenterWalkthroughBanner } from './components/PresenterWalkthroughBanner';
import { GodModeHub } from './components/GodModeHub';
import { LoginModal } from './components/LoginModal';

export default function App() {
  // Read URL query parameters and localStorage to initialize state
  const getInitialState = () => {
    if (typeof window === 'undefined') {
      return { 
        role: 'farmer', 
        tab: 'dashboard', 
        batch: null,
        farmerTab: 'dashboard',
        logisticTab: 'dashboard',
        darkStoreTab: 'dashboard',
        consumerTab: 'home',
        adminTab: 'all'
      };
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      const urlTab = params.get('tab');
      const urlBatch = params.get('batch');

      const validRoles = ['farmer', 'logistics', 'darkstore', 'consumer', 'admin'];
      let role = 'farmer';
      if (urlRole && validRoles.includes(urlRole.toLowerCase())) {
        role = urlRole.toLowerCase();
      }

      const getSavedTab = (r, defaultTab) => {
        if (urlRole && urlRole.toLowerCase() === r && urlTab) {
          return urlTab;
        }
        try {
          const s = localStorage.getItem(`agrichain_${r}_tab`);
          if (s) return s;
          if (r === 'logistics') {
            const alt = localStorage.getItem('agrichain_logistic_tab');
            if (alt) return alt;
          }
        } catch (_) {}
        return defaultTab;
      };

      const farmerTab = getSavedTab('farmer', 'dashboard');
      const logisticTab = getSavedTab('logistics', 'dashboard');
      const darkStoreTab = getSavedTab('darkstore', 'dashboard');
      const consumerTab = getSavedTab('consumer', urlBatch ? 'journey' : 'home');
      const adminTab = getSavedTab('admin', 'all');

      let currentTab = farmerTab;
      if (role === 'logistics') currentTab = logisticTab;
      else if (role === 'darkstore') currentTab = darkStoreTab;
      else if (role === 'consumer') currentTab = consumerTab;
      else if (role === 'admin') currentTab = adminTab;

      return {
        role,
        tab: currentTab,
        batch: urlBatch || null,
        farmerTab,
        logisticTab,
        darkStoreTab,
        consumerTab,
        adminTab
      };
    } catch (_) {
      return { 
        role: 'farmer', 
        tab: 'dashboard', 
        batch: null,
        farmerTab: 'dashboard',
        logisticTab: 'dashboard',
        darkStoreTab: 'dashboard',
        consumerTab: 'home',
        adminTab: 'all'
      };
    }
  };

  const initialUrlState = getInitialState();

  // Role Portal State: 'farmer', 'logistics', 'darkstore', 'consumer', or 'admin'
  const [activeRole, setActiveRole] = useState(initialUrlState.role);
  const [adminTab, setAdminTab] = useState(initialUrlState.adminTab);
  const [isShowcaseDrawerOpen, setIsShowcaseDrawerOpen] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);
  const [godModeInitialBatchId, setGodModeInitialBatchId] = useState(null);
  const [godModeInitialStep, setGodModeInitialStep] = useState(1);

  const handleLaunchGodMode = (batchId = null, step = 1) => {
    if (batchId) setGodModeInitialBatchId(batchId);
    setGodModeInitialStep(step);
    setIsGodMode(true);
  };

  // Tab state for Farmer portal
  const [farmerTab, setFarmerTab] = useState(initialUrlState.farmerTab);
  const [selectedCropCategory, setSelectedCropCategory] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [farmerKpis, setFarmerKpis] = useState([]);
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [farmerActivities, setFarmerActivities] = useState([]);
  const [farmerTrust, setFarmerTrust] = useState(null);
  const [farmerLoading, setFarmerLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState(initialUrlState.batch);

  const fetchFarmerData = useCallback(async () => {
    try {
      const [kpiRes, cropsRes, actRes, invRes, trustRes] = await Promise.allSettled([
        fetch('http://localhost:8000/farmer/kpis').then(r => r.json()),
        fetch('http://localhost:8000/farmer/crops').then(r => r.json()),
        fetch('http://localhost:8000/farmer/activity').then(r => r.json()),
        fetch('http://localhost:8000/farmer/inventory').then(r => r.json()),
        fetch('http://localhost:8000/farmer/quality-rating').then(r => r.json())
      ]);

      if (kpiRes.status === 'fulfilled' && Array.isArray(kpiRes.value)) {
        setFarmerKpis(kpiRes.value);
      }
      if (cropsRes.status === 'fulfilled' && Array.isArray(cropsRes.value)) {
        setFarmerCrops(cropsRes.value);
      }
      if (actRes.status === 'fulfilled' && Array.isArray(actRes.value)) {
        setFarmerActivities(actRes.value);
      }
      if (invRes.status === 'fulfilled' && invRes.value && Array.isArray(invRes.value.items)) {
        setInventoryList(invRes.value.items);
        if (invRes.value.items.length > 0 && !selectedBatchId) {
          setSelectedBatchId(invRes.value.items[0].batchId);
        }
      }
      if (trustRes.status === 'fulfilled' && trustRes.value && trustRes.value.score !== undefined) {
        setFarmerTrust(trustRes.value);
      }
    } catch (err) {
      console.error('Error fetching farmer data from backend:', err);
    } finally {
      setFarmerLoading(false);
    }
  }, []);

  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  useEffect(() => {
    const handleResetEvent = () => {
      fetchFarmerData();
      setResetKey((k) => k + 1);
    };
    window.addEventListener('agrichain-data-reset', handleResetEvent);
    window.addEventListener('agrichain-data-updated', handleResetEvent);
    return () => {
      window.removeEventListener('agrichain-data-reset', handleResetEvent);
      window.removeEventListener('agrichain-data-updated', handleResetEvent);
    };
  }, [fetchFarmerData]);

  // Tab state for Logistics Partner portal
  const [logisticTab, setLogisticTab] = useState(initialUrlState.logisticTab);

  // Tab state for Dark Store portal
  const [darkStoreTab, setDarkStoreTab] = useState(initialUrlState.darkStoreTab);

  // Tab state for Consumer portal
  const [consumerTab, setConsumerTab] = useState(initialUrlState.consumerTab);
  const [consumerBatchId, setConsumerBatchId] = useState(initialUrlState.batch);

  // Synchronize active role and tab to URL query parameters & localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('role', activeRole);

      let currentTab = '';
      if (activeRole === 'farmer') currentTab = farmerTab;
      else if (activeRole === 'logistics') currentTab = logisticTab;
      else if (activeRole === 'darkstore') currentTab = darkStoreTab;
      else if (activeRole === 'consumer') currentTab = consumerTab;
      else if (activeRole === 'admin') currentTab = adminTab;

      if (currentTab) {
        url.searchParams.set('tab', currentTab);
      } else {
        url.searchParams.delete('tab');
      }

      if (activeRole === 'consumer' && consumerBatchId) {
        url.searchParams.set('batch', consumerBatchId);
      } else if (activeRole === 'farmer' && selectedBatchId && (farmerTab === 'traceability' || farmerTab === 'crop-details')) {
        url.searchParams.set('batch', selectedBatchId);
      } else {
        url.searchParams.delete('batch');
      }

      const newRelativePathQuery = url.pathname + url.search;
      if (window.location.pathname + window.location.search !== newRelativePathQuery) {
        window.history.replaceState({ role: activeRole, tab: currentTab }, '', newRelativePathQuery);
      }

      localStorage.setItem('agrichain_active_role', activeRole);
      if (currentTab) {
        localStorage.setItem(`agrichain_${activeRole}_tab`, currentTab);
      }
    } catch (_) {}
  }, [activeRole, farmerTab, logisticTab, darkStoreTab, consumerTab, adminTab, consumerBatchId, selectedBatchId]);

  // Sync state if user navigates with browser history / URL
  useEffect(() => {
    const handleUrlChange = () => {
      const state = getInitialState();
      if (state.role) setActiveRole(state.role);
      if (state.role === 'farmer') {
        if (state.farmerTab) setFarmerTab(state.farmerTab);
        if (state.batch) setSelectedBatchId(state.batch);
      } else if (state.role === 'logistics') {
        if (state.logisticTab) setLogisticTab(state.logisticTab);
      } else if (state.role === 'darkstore') {
        if (state.darkStoreTab) setDarkStoreTab(state.darkStoreTab);
      } else if (state.role === 'consumer') {
        if (state.consumerTab) setConsumerTab(state.consumerTab);
        if (state.batch) setConsumerBatchId(state.batch);
      } else if (state.role === 'admin') {
        if (state.adminTab) setAdminTab(state.adminTab);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Shared Modals state
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleViewJourney = (batchId) => {
    if (batchId) setSelectedBatchId(batchId);
    setIsJourneyOpen(true);
  };

  const handleSwitchRole = (newRole) => {
    setActiveRole(newRole);
    try {
      localStorage.setItem('agrichain_active_role', newRole);
    } catch (_) {}
  };

  const handleSelectFarmerTab = (tabId) => {
    setFarmerTab(tabId);
    setSelectedCropCategory(null);
    try {
      localStorage.setItem('agrichain_farmer_tab', tabId);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLogisticTab = (tabId) => {
    setLogisticTab(tabId);
    try {
      localStorage.setItem('agrichain_logistics_tab', tabId);
      localStorage.setItem('agrichain_logistic_tab', tabId);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDarkStoreTab = (tabId) => {
    setDarkStoreTab(tabId);
    try {
      localStorage.setItem('agrichain_darkstore_tab', tabId);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectConsumerTab = (tabId) => {
    setConsumerTab(tabId);
    try {
      localStorage.setItem('agrichain_consumer_tab', tabId);
    } catch (_) {}
  };

  const handleSelectAdminTab = (tabId) => {
    setAdminTab(tabId);
    try {
      localStorage.setItem('agrichain_admin_tab', tabId);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateRoleAndTab = (role, tab, batchId = null) => {
    handleSwitchRole(role);
    if (batchId) {
      if (role === 'consumer') setConsumerBatchId(batchId);
      if (role === 'farmer') setSelectedBatchId(batchId);
    }
    if (role === 'farmer') {
      handleSelectFarmerTab(tab || 'dashboard');
    } else if (role === 'logistics') {
      handleSelectLogisticTab(tab || 'dashboard');
    } else if (role === 'darkstore') {
      handleSelectDarkStoreTab(tab || 'dashboard');
    } else if (role === 'consumer') {
      handleSelectConsumerTab(tab || 'home');
    } else if (role === 'admin') {
      handleSelectAdminTab(tab === 'dashboard' ? 'all' : (tab || 'all'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (category) => {
    setSelectedCropCategory(category);
    handleSelectFarmerTab('crop-details');
  };

  const handleAddStock = (newStock) => {
    setInventoryList((prev) => [newStock, ...prev]);
    const bId = newStock.batchId || newStock.batch_id || 'NEW-BATCH';
    const newAct = {
      id: `act-${Date.now()}`,
      type: "order",
      title: `Batch Registered #${bId}`,
      status: "Confirmed",
      statusType: "confirmed",
      date: "Just now",
      amount: `${newStock.name || 'Crop'} Added`,
    };
    setFarmerActivities((prev) => [newAct, ...prev]);
    fetchFarmerData();
    window.dispatchEvent(new CustomEvent('agrichain-data-updated'));
    if (selectedCropCategory) {
      setSelectedCropCategory((prev) => {
        if (!prev) return prev;
        const matches = 
          prev.name.toLowerCase() === (newStock.category || '').toLowerCase() ||
          prev.id.toLowerCase() === (newStock.category || '').toLowerCase();
        if (matches) {
          return {
            ...prev,
            crops: [{
              name: newStock.name,
              quantity: newStock.quantity,
              value: newStock.value,
              status: newStock.status || "In Stock",
              quality: `Fresh Organic ${newStock.name}`
            }, ...(prev.crops || [])]
          };
        }
        return prev;
      });
    }
  };

  const ROLE_NAMES = {
    farmer: 'Rahul Patil (Farmer)',
    logistics: 'Safexpress Logistics',
    darkstore: 'Pune Fresh DarkStore Hub',
    consumer: 'Priya Sharma',
    admin: 'System Administrator',
  };

  const { count: unreadNotifsCount } = useNotificationCount(activeRole);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agrichain_current_user');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem('agrichain_current_user');
      fetch('http://localhost:8000/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (_) {}
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('agrichain_current_user', JSON.stringify(user));
    } catch (_) {}
    if (user && user.role) {
      const defaultTab = user.role === 'admin' ? 'all' : (user.role === 'consumer' ? 'home' : 'dashboard');
      handleNavigateRoleAndTab(user.role, defaultTab);
    }
    setIsLoginModalOpen(false);
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-[#FAF7F0] text-[#3B3028] font-sans antialiased flex flex-col select-none">

        
        {/* Persistent Top Navigation Bar (Role Switcher & Web3 Wallet) */}
        <header className={`sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E6E1D5] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 shadow-2xs transition-all ${
          activeRole === 'consumer' ? 'w-full ml-0' : 'w-full md:w-[calc(100%-16rem)] md:ml-64'
        }`}>
          {/* Left: Active Portal Indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#354424] animate-pulse" />
            <span className="text-xs font-black text-[#2D2620] uppercase tracking-wider hidden sm:inline">
              {activeRole === 'logistics' && '🚛 SafeXpress Logistics'}
              {activeRole === 'farmer' && '🌿 Farmer Portal'}
              {activeRole === 'darkstore' && '🏬 Dark Store Hub'}
              {activeRole === 'consumer' && '🛒 Consumer Marketplace'}
              {activeRole === 'admin' && '⚡ Master Governance'}
            </span>
          </div>

          {/* Right: Role Switcher & Web3 Wallet Control Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-white/95 rounded-2xl border border-[#E6E1D5] shadow-xs max-w-full overflow-x-auto no-scrollbar whitespace-nowrap flex-shrink-0">
            <button
              onClick={() => handleSwitchRole('farmer')}
              className={`px-3 h-[32px] rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activeRole === 'farmer' 
                  ? 'bg-[#3D4E2A] text-white shadow-xs' 
                  : 'text-[#666057] hover:text-[#2D2620]'
              }`}
            >
              <span>🌿</span>
              <span>Farmer</span>
            </button>
            <button
              onClick={() => handleSwitchRole('logistics')}
              className={`px-3 h-[32px] rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activeRole === 'logistics' 
                  ? 'bg-[#354424] text-white shadow-xs' 
                  : 'text-[#666057] hover:text-[#2D2620]'
              }`}
            >
              <span>🚛</span>
              <span>Logistics</span>
            </button>
            <button
              onClick={() => handleSwitchRole('darkstore')}
              className={`px-3 h-[32px] rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activeRole === 'darkstore' 
                  ? 'bg-[#3D4E2A] text-white shadow-xs' 
                  : 'text-[#666057] hover:text-[#2D2620]'
              }`}
            >
              <span>🏬</span>
              <span>Dark Store</span>
            </button>
            <button
              onClick={() => {
                handleSwitchRole('consumer');
                if (consumerTab === 'onboarding') handleSelectConsumerTab('home');
              }}
              className={`px-3 h-[32px] rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activeRole === 'consumer' 
                  ? 'bg-[#354424] text-white shadow-xs' 
                  : 'text-[#666057] hover:text-[#2D2620]'
              }`}
            >
              <span>🛒</span>
              <span>Consumer</span>
            </button>
            <button
              onClick={() => handleSwitchRole('admin')}
              className={`px-3 h-[32px] rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activeRole === 'admin' 
                  ? 'bg-[#3D4E2A] text-white shadow-xs' 
                  : 'text-[#666057] hover:text-[#2D2620]'
              }`}
            >
              <span>⚡</span>
              <span>Admin</span>
            </button>

            <div className="h-5 w-px bg-[#E6E1D5] mx-1 flex-shrink-0" />

            {/* Universal Notification Bell with Unread Badge */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-1.5 h-[32px] w-[32px] rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] cursor-pointer transition-colors shadow-2xs flex-shrink-0"
              title="View Live Notifications & Alerts"
            >
              <Bell className="w-4 h-4 text-[#354424]" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#354424] text-white text-[9px] font-black flex items-center justify-center border border-white">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Active User Account & Switch Persona Button */}
            <WalletConnect 
              activeRole={activeRole} 
              currentUser={currentUser}
              onSwitchAccount={() => setIsLoginModalOpen(true)}
            />
          </div>
        </header>

        {/* Presenter Guided Walkthrough Banner or Omniscient God Mode Guided Tour */}
        {isGodMode ? (
          <GodModeHub
            activeRole={activeRole}
            currentRoleTab={
              activeRole === 'farmer' ? farmerTab :
              activeRole === 'logistics' ? logisticTab :
              activeRole === 'darkstore' ? darkStoreTab :
              activeRole === 'consumer' ? consumerTab : 'dashboard'
            }
            initialBatchId={godModeInitialBatchId}
            initialStep={godModeInitialStep}
            onExit={() => {
              setIsGodMode(false);
              setGodModeInitialBatchId(null);
            }}
            onNavigateRoleAndTab={(role, tab, batchId) => {
              handleNavigateRoleAndTab(role, tab, batchId);
            }}
          />
        ) : (
          <PresenterWalkthroughBanner 
            currentRole={activeRole} 
            onNavigateRoleAndTab={handleNavigateRoleAndTab}
            onOpenShowcaseLab={() => setIsShowcaseDrawerOpen(true)}
            onOpenGodMode={() => handleLaunchGodMode(null, 1)}
          />
        )}

      {/* ========================================== */}
      {/* 1. LOGISTICS PARTNER PORTAL VIEW          */}
      {/* ========================================== */}
      {activeRole === 'logistics' && (
        <>
          <LogisticSidebar 
            currentTab={logisticTab} 
            onSelectTab={handleSelectLogisticTab} 
            onLogout={handleLogout}
          />

          <main className="min-w-0 flex-1 md:ml-64 w-full md:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-8 max-w-7xl pb-24 md:pb-8 pt-4 sm:pt-6">
            {logisticTab === 'dashboard' && (
              <LogisticDashboardView 
                onSelectTab={handleSelectLogisticTab} 
                onOpenNotifications={() => setIsNotificationsOpen(true)} 
              />
            )}
            {logisticTab === 'available-produce' && (
              <AvailableProduceView onProcure={() => handleSelectLogisticTab('procurement-orders')} />
            )}
            {logisticTab === 'procurement-orders' && (
              <ProcurementOrdersView onNavigate={(tab) => handleSelectLogisticTab(tab)} />
            )}
            {logisticTab === 'transportation' && (
              <TransportationView />
            )}
            {logisticTab === 'storage' && (
              <StorageView />
            )}
            {logisticTab === 'shipment-tracking' && (
              <ShipmentTrackingView />
            )}
            {logisticTab === 'ai-trust' && (
              <LogisticAITrustView onBack={() => handleSelectLogisticTab('dashboard')} />
            )}
            {logisticTab === 'traceability' && (
              <LogisticTraceabilityView />
            )}
            {logisticTab === 'inventory' && (
              <LogisticInventoryView />
            )}
            {logisticTab === 'transactions' && (
              <TransactionsView />
            )}
            {logisticTab === 'profile' && (
              <LogisticProfileView 
                onLogout={handleLogout} 
                onBack={() => handleSelectLogisticTab('dashboard')} 
              />
            )}
          </main>

          <LogisticBottomNav 
            currentTab={logisticTab} 
            onSelectTab={handleSelectLogisticTab} 
          />
        </>
      )}

      {/* ========================================== */}
      {/* 2. FARMER PORTAL VIEW                      */}
      {/* ========================================== */}
      {activeRole === 'farmer' && (
        <>
          <FarmerSidebar 
            currentTab={farmerTab} 
            onSelectTab={handleSelectFarmerTab} 
            onLogout={handleLogout}
          />

          <main className="min-w-0 flex-1 md:ml-64 w-full md:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-8 max-w-7xl pb-24 md:pb-8 pt-4 sm:pt-6">
            {farmerTab === 'dashboard' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <FarmerHeader 
                  onOpenNotifications={() => setIsNotificationsOpen(true)} 
                  onOpenAddStock={() => setIsAddStockOpen(true)} 
                />
                <FarmerKPICards metrics={farmerKpis} onCardClick={(type) => handleSelectFarmerTab(type)} />
                
                {/* Upper Row: Crop Overview & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7">
                    <FarmerCropOverview categories={farmerCrops} onSelectCategory={handleSelectCategory} onViewAll={() => handleSelectFarmerTab('my-crops')} />
                  </div>
                  <div className="lg:col-span-5 flex flex-col">
                    <FarmerRecentActivity activities={farmerActivities} onViewAll={() => handleSelectFarmerTab('orders')} />
                  </div>
                </div>

                {/* RESTORED LOWER DASHBOARD SUMMARY AREA: TRACEABILITY & AI TRUST SCORE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  
                  {/* LEFT CARD: TRACEABILITY (lg:col-span-6) */}
                  <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <button 
                          onClick={() => handleSelectFarmerTab('traceability')}
                          className="flex items-center gap-2.5 text-xl font-extrabold text-[#2D2620] hover:text-[#556B2F] transition-colors cursor-pointer group"
                        >
                          <span>Traceability</span>
                          <div className="w-7 h-7 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] group-hover:bg-[#E6E1D5] group-hover:translate-x-0.5 transition-all flex-shrink-0">
                            <ArrowRight className="w-3.5 h-3.5 text-[#2D2620]" />
                          </div>
                        </button>
                        <p className="text-xs text-[#666057] mt-1 font-medium">Track your produce from farm to fork</p>
                      </div>

                      {/* Stepper Journey Nodes */}
                      <div className="py-3">
                        <div className="flex items-center justify-between relative">
                          {/* Connecting Line */}
                          <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E6E1D5] -z-0" />

                          {/* Node 1: Farm */}
                          <div className="flex flex-col items-center z-10">
                            <div className="w-9 h-9 rounded-full bg-[#EBF3E8] border border-[#556B2F]/40 text-[#556B2F] flex items-center justify-center text-sm font-extrabold shadow-xs">
                              🌱
                            </div>
                            <span className="text-xs font-bold text-[#2D2620] mt-1.5">Farm</span>
                            <span className="text-[10px] font-semibold text-[#556B2F]">Completed</span>
                          </div>

                          {/* Node 2: Harvest */}
                          <div className="flex flex-col items-center z-10">
                            <div className="w-9 h-9 rounded-full bg-[#EBF3E8] border border-[#556B2F]/40 text-[#556B2F] flex items-center justify-center text-sm font-extrabold shadow-xs">
                              🌾
                            </div>
                            <span className="text-xs font-bold text-[#2D2620] mt-1.5">Harvest</span>
                            <span className="text-[10px] font-semibold text-[#556B2F]">Completed</span>
                          </div>

                          {/* Node 3: Processing */}
                          <div className="flex flex-col items-center z-10">
                            <div className="w-9 h-9 rounded-full bg-[#EBF3E8] border border-[#556B2F]/40 text-[#556B2F] flex items-center justify-center text-sm font-extrabold shadow-xs">
                              🏭
                            </div>
                            <span className="text-xs font-bold text-[#2D2620] mt-1.5">Processing</span>
                            <span className="text-[10px] font-semibold text-[#556B2F]">Completed</span>
                          </div>

                          {/* Node 4: Transport */}
                          <div className="flex flex-col items-center z-10">
                            <div className="w-9 h-9 rounded-full bg-[#FFF3EB] border border-[#B85C38]/40 text-[#B85C38] flex items-center justify-center text-sm font-extrabold shadow-xs">
                              🚚
                            </div>
                            <span className="text-xs font-bold text-[#2D2620] mt-1.5">Transport</span>
                            <span className="text-[10px] font-bold text-[#B85C38]">In Transit</span>
                          </div>

                          {/* Node 5: Store */}
                          <div className="flex flex-col items-center z-10">
                            <div className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] text-[#8C8275] flex items-center justify-center text-sm font-extrabold">
                              🏬
                            </div>
                            <span className="text-xs font-bold text-[#666057] mt-1.5">Store</span>
                            <span className="text-[10px] font-bold text-[#B85C38]">Pending</span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Info Card */}
                      <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#666057] font-semibold">Product</span>
                          <span className="font-extrabold text-[#2D2620]">{inventoryList[0]?.name || 'Wheat'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#666057] font-semibold">Batch ID</span>
                          <span className="font-extrabold text-[#2D2620]">{inventoryList[0]?.batchId || inventoryList[0]?.id || 'WH-120525-01'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#666057] font-semibold">Current Location</span>
                          <span className="font-extrabold text-[#2D2620]">{inventoryList[0]?.status || 'On the way to Dark Store'}</span>
                        </div>
                      </div>
                    </div>

                    {/* View Full Journey Action Button */}
                    <button 
                      onClick={() => handleViewJourney(inventoryList[0]?.batchId || inventoryList[0]?.id || 'TM1256')}
                      className="w-full py-3.5 rounded-xl bg-[#3D4E2A] text-white text-xs sm:text-sm font-extrabold hover:bg-[#2A371B] transition-all cursor-pointer shadow-xs"
                    >
                      View Full Journey
                    </button>
                  </div>

                  {/* RIGHT CARD: FARM QUALITY & REPUTATION (lg:col-span-6) */}
                  <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      {/* Header */}
                      <button 
                        onClick={() => handleSelectFarmerTab('ai-trust')}
                        className="flex items-center gap-2.5 text-xl font-extrabold text-[#2D2620] hover:text-[#556B2F] transition-colors cursor-pointer group"
                      >
                        <span>Farm Quality & Certification</span>
                        <div className="w-7 h-7 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] group-hover:bg-[#E6E1D5] group-hover:translate-x-0.5 transition-all flex-shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-[#2D2620]" />
                        </div>
                      </button>

                      {/* Top Rating Banner */}
                      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-[#3D4E2A] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                            <span className="text-xl">🏅</span>
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">
                                {farmerTrust?.score !== undefined ? farmerTrust.score : 0}
                              </span>
                              <span className="text-sm font-bold text-[#666057]">/100</span>
                              <span className="text-sm font-extrabold text-[#3D4E2A] ml-1.5">
                                {farmerTrust?.level || 'Grade A+ Producer'}
                              </span>
                            </div>
                            <p className="text-xs text-[#666057] mt-0.5">
                              {farmerTrust?.status ? `${farmerTrust.status}.` : 'Origin & harvest quality verified.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-start xl:self-auto flex-wrap">
                          {/* Smooth Upward-Trending Quality Score Line Chart */}
                          <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40">
                            <defs>
                              <linearGradient id="farmerTrustGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#556B2F" stopOpacity="0.30" />
                                <stop offset="100%" stopColor="#556B2F" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Subtle Filled Area Below Line */}
                            <path 
                              d={farmerTrust?.score > 0 ? "M 5 32 C 25 30, 45 22, 65 15 T 95 6 L 95 38 L 5 38 Z" : "M 5 36 L 95 36 L 95 38 L 5 38 Z"} 
                              fill="url(#farmerTrustGradient)" 
                            />

                            {/* Upward-Trending Line */}
                            <path 
                              d={farmerTrust?.score > 0 ? "M 5 32 C 25 30, 45 22, 65 15 T 95 6" : "M 5 36 L 95 36"} 
                              fill="none" 
                              stroke="#556B2F" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                            />

                            {/* Plotted Points */}
                            <circle cx="5" cy={farmerTrust?.score > 0 ? 32 : 36} r="2" fill="#556B2F" />
                            <circle cx="35" cy={farmerTrust?.score > 0 ? 26 : 36} r="2" fill="#556B2F" />
                            <circle cx="65" cy={farmerTrust?.score > 0 ? 15 : 36} r="2" fill="#556B2F" />
                            <circle cx="95" cy={farmerTrust?.score > 0 ? 6 : 36} r="3.5" fill="#3D4E2A" stroke="#ffffff" strokeWidth="1.5" />
                          </svg>
                          <button 
                            onClick={() => handleSelectFarmerTab('ai-trust')}
                            className="px-3.5 py-2 rounded-xl bg-white border border-[#E6E1D5] text-xs font-bold text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Harvest & Quality Checkpoints */}
                      <div className="space-y-2.5">
                        <span className="text-[11px] font-extrabold text-[#8C8275] uppercase tracking-wider block">
                          HARVEST & ORIGIN QUALITY CHECKPOINTS
                        </span>

                        {/* Checkpoint Rows */}
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> {farmerTrust?.aiVerificationDetails?.[0]?.title || 'Harvest Quality Grade'}
                            </span>
                            <span className="font-extrabold text-[#354424]">{farmerTrust?.aiVerificationDetails?.[0]?.status || 'Grade A (Export / Prime Standard)'}</span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> {farmerTrust?.aiVerificationDetails?.[1]?.title || 'Farm Certifications (IPFS)'}
                            </span>
                            <span className="font-extrabold text-[#354424]">{farmerTrust?.aiVerificationDetails?.[1]?.status || 'GAP & Organic Lab Tests Anchored'}</span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> {farmerTrust?.aiVerificationDetails?.[2]?.title || 'Fulfillment Reliability'}
                            </span>
                            <span className="font-extrabold text-[#354424]">{farmerTrust?.aiVerificationDetails?.[2]?.status || '100% On-Time Batch Handover'}</span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> {farmerTrust?.aiVerificationDetails?.[3]?.title || 'Consumer Satisfaction'}
                            </span>
                            <span className="font-extrabold text-[#354424]">{farmerTrust?.aiVerificationDetails?.[3]?.status || '5.0/5.0 ★ (13 Buyer Reviews)'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {farmerTab === 'my-crops' && (
              <MyCropsView 
                categories={farmerCrops} 
                onSelectCategory={handleSelectCategory} 
                onBack={() => handleSelectFarmerTab('dashboard')} 
              />
            )}
            {farmerTab === 'crop-details' && (
              <CropDetailsView 
                category={selectedCropCategory} 
                onBack={() => handleSelectFarmerTab('my-crops')} 
              />
            )}
            {farmerTab === 'inventory' && (
              <FarmerInventoryView 
                items={inventoryList} 
                onBack={() => handleSelectFarmerTab('dashboard')} 
                onAddItem={() => setIsAddStockOpen(true)} 
                onOpenAddStock={() => setIsAddStockOpen(true)} 
                onSelectItem={(item) => handleViewJourney(item.batchId || item.id)} 
              />
            )}
            {farmerTab === 'orders' && (
              <FarmerOrdersView 
                onBack={() => handleSelectFarmerTab('dashboard')} 
                onSelectOrder={(ord) => handleViewJourney(ord.batchId || 'TM1256')} 
              />
            )}
            {farmerTab === 'shipments' && (
              <FarmerShipmentsView 
                onBack={() => handleSelectFarmerTab('dashboard')} 
                onViewJourney={handleViewJourney} 
              />
            )}
            {farmerTab === 'traceability' && (
              <FarmerTraceabilityView 
                onBack={() => handleSelectFarmerTab('dashboard')} 
                onOpenFullJourney={handleViewJourney} 
                onViewJourney={handleViewJourney} 
              />
            )}
            {farmerTab === 'ai-trust' && (
              <FarmerQualityView 
                onBack={() => handleSelectFarmerTab('dashboard')} 
              />
            )}
            {farmerTab === 'earnings' && (
              <EarningsView 
                onBack={() => handleSelectFarmerTab('dashboard')} 
              />
            )}
            {farmerTab === 'profile' && (
              <FarmerProfileView 
                onBack={() => handleSelectFarmerTab('dashboard')} 
                onLogout={handleLogout} 
              />
            )}
          </main>

          <FarmerBottomNav currentTab={farmerTab} onSelectTab={handleSelectFarmerTab} onOpenMore={() => setIsMoreOpen(true)} />
        </>
      )}

      {/* ========================================== */}
      {/* 3. DARK STORE PORTAL VIEW                  */}
      {/* ========================================== */}
      {activeRole === 'darkstore' && (
        <DarkStoreApp 
          key={`darkstore-${resetKey}`} 
          currentTab={darkStoreTab}
          onSelectTab={handleSelectDarkStoreTab}
          onLogout={handleLogout}
        />
      )}

      {/* ========================================== */}
      {/* 4. CONSUMER PORTAL VIEW                    */}
      {/* ========================================== */}
      {activeRole === 'consumer' && (
        <div key={`consumer-${resetKey}`} className="w-full min-h-screen flex-1 bg-[#FAF7F0]">
          <ConsumerApp 
            currentTab={consumerTab}
            initialBatchId={consumerBatchId}
            onSelectTab={handleSelectConsumerTab}
            onLogout={(role) => {
              if (role) handleSwitchRole(role);
              else handleLogout();
            }} 
          />
        </div>
      )}

      {/* ========================================== */}
      {/* 5. MASTER ADMIN GOVERNANCE PORTAL VIEW     */}
      {/* ========================================== */}
      {activeRole === 'admin' && (
        <>
          <AdminSidebar 
            currentTab={adminTab}
            onSelectTab={handleSelectAdminTab}
            onLogout={handleLogout}
          />
          <AdminPortalView currentTab={adminTab} />
          <AdminBottomNav 
            currentTab={adminTab}
            onSelectTab={handleSelectAdminTab}
          />
        </>
      )}

      {/* Shared Modals */}
      <MoreMenuSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} onSelectTab={handleSelectFarmerTab} currentTab={farmerTab} onLogout={handleLogout} />
      <AddStockModal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} onAddStock={handleAddStock} />
      <ViewJourneyModal isOpen={isJourneyOpen} onClose={() => setIsJourneyOpen(false)} batchId={selectedBatchId} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} role={activeRole} />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
        currentRole={activeRole}
      />

      {/* Showcase & Demo Drawer */}
      <ShowcaseDrawer 
        isOpenExternal={isShowcaseDrawerOpen}
        setIsOpenExternal={setIsShowcaseDrawerOpen}
        onNavigateRoleAndTab={handleNavigateRoleAndTab}
        onLaunchGodMode={(batchId, step = 1) => {
          handleLaunchGodMode(batchId, step);
        }}
      />


    </div>
  </WalletProvider>
  );
}
