import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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

// Dark Store Portal
import { DarkStoreApp } from './Dark_Store/DarkStoreApp';

// Consumer Portal
import { ConsumerApp } from './Consumer/ConsumerApp';

// Data
import { 
  cropCategories, 
  recentActivities, 
  inventoryItems as initialInventory 
} from './data/mockData';

export default function App() {
  // Role Portal State: 'consumer' (default launch role), 'farmer', 'logistics', or 'darkstore'
  const [activeRole, setActiveRole] = useState('consumer');

  // Tab state for Farmer portal
  const [farmerTab, setFarmerTab] = useState('dashboard');
  const [selectedCropCategory, setSelectedCropCategory] = useState(null);
  const [inventoryList, setInventoryList] = useState(initialInventory);

  // Tab state for Logistics Partner portal
  const [logisticTab, setLogisticTab] = useState('dashboard');

  // Shared Modals state
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleSelectFarmerTab = (tabId) => {
    setFarmerTab(tabId);
    setSelectedCropCategory(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLogisticTab = (tabId) => {
    setLogisticTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (category) => {
    setSelectedCropCategory(category);
    setFarmerTab('crop-details');
  };

  const handleAddStock = (newStock) => {
    setInventoryList([newStock, ...inventoryList]);
  };

  const handleLogout = () => {
    alert(`Logged out of Rahul Patil's AgriChain ${activeRole} Account.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#3B3028] font-sans antialiased flex flex-col md:flex-row select-none">
      
      {/* Role Switcher Floating Control Bar (Hidden on Consumer Landing Page) */}
      {activeRole !== 'consumer' && (
        <div className="fixed top-3 right-4 sm:right-6 z-50 flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E6E1D5] shadow-sm">
          <button
            onClick={() => setActiveRole('farmer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === 'farmer' 
                ? 'bg-[#3D4E2A] text-white shadow-xs' 
                : 'text-[#666057] hover:text-[#2D2620]'
            }`}
          >
            <span>🌿</span>
            <span>Farmer</span>
          </button>
          <button
            onClick={() => setActiveRole('logistics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === 'logistics' 
                ? 'bg-[#354424] text-white shadow-xs' 
                : 'text-[#666057] hover:text-[#2D2620]'
            }`}
          >
            <span>🚛</span>
            <span>Logistics Partner</span>
          </button>
          <button
            onClick={() => setActiveRole('darkstore')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === 'darkstore' 
                ? 'bg-[#1E293B] text-white shadow-xs' 
                : 'text-[#666057] hover:text-[#2D2620]'
            }`}
          >
            <span>🏬</span>
            <span>Dark Store</span>
          </button>
          <button
            onClick={() => setActiveRole('consumer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === 'consumer' 
                ? 'bg-[#354424] text-white shadow-xs' 
                : 'text-[#666057] hover:text-[#2D2620]'
            }`}
          >
            <span>🛒</span>
            <span>Consumer</span>
          </button>
        </div>
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

          <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 pt-14 md:pt-8">
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
              <ProcurementOrdersView />
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
              <LogisticProfileView />
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

          <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 pt-14 md:pt-8">
            {farmerTab === 'dashboard' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <FarmerHeader onOpenNotifications={() => setIsNotificationsOpen(true)} />
                <FarmerKPICards metrics={[]} onCardClick={(type) => handleSelectFarmerTab(type)} />
                
                {/* Upper Row: Crop Overview & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7">
                    <FarmerCropOverview categories={cropCategories} onSelectCategory={handleSelectCategory} onViewAll={() => handleSelectFarmerTab('my-crops')} />
                  </div>
                  <div className="lg:col-span-5 flex flex-col">
                    <FarmerRecentActivity activities={recentActivities} onViewAll={() => handleSelectFarmerTab('orders')} />
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
                          <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] group-hover:bg-[#E6E1D5] transition-colors flex-shrink-0">
                            <ArrowLeft className="w-4 h-4 text-[#2D2620]" />
                          </div>
                          <span>Traceability</span>
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
                          <span className="font-extrabold text-[#2D2620]">Wheat</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#666057] font-semibold">Batch ID</span>
                          <span className="font-extrabold text-[#2D2620]">WH-120525-01</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#666057] font-semibold">Current Location</span>
                          <span className="font-extrabold text-[#2D2620]">On the way to Dark Store</span>
                        </div>
                      </div>
                    </div>

                    {/* View Full Journey Action Button */}
                    <button 
                      onClick={() => setIsJourneyOpen(true)}
                      className="w-full py-3.5 rounded-xl bg-[#3D4E2A] text-white text-xs sm:text-sm font-extrabold hover:bg-[#2A371B] transition-all cursor-pointer shadow-xs"
                    >
                      View Full Journey
                    </button>
                  </div>

                  {/* RIGHT CARD: AI TRUST SCORE (lg:col-span-6) */}
                  <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      {/* Header */}
                      <button 
                        onClick={() => handleSelectFarmerTab('ai-trust')}
                        className="flex items-center gap-2.5 text-xl font-extrabold text-[#2D2620] hover:text-[#556B2F] transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] group-hover:bg-[#E6E1D5] transition-colors flex-shrink-0">
                          <ArrowLeft className="w-4 h-4 text-[#2D2620]" />
                        </div>
                        <span>AI Trust Score</span>
                      </button>

                      {/* Top Rating Banner */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-[#3D4E2A] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                            <span className="text-xl">🛡️</span>
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">92</span>
                              <span className="text-sm font-bold text-[#666057]">/100</span>
                              <span className="text-sm font-extrabold text-[#3D4E2A] ml-1.5">High Trust</span>
                            </div>
                            <p className="text-xs text-[#666057] mt-0.5">Your produce is safe and trustworthy.</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {/* Smooth Upward-Trending AI Trust Score Line Chart */}
                          <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40">
                            <defs>
                              <linearGradient id="farmerTrustGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#556B2F" stopOpacity="0.30" />
                                <stop offset="100%" stopColor="#556B2F" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Subtle Filled Area Below Line */}
                            <path 
                              d="M 5 32 C 25 30, 45 22, 65 15 T 95 6 L 95 38 L 5 38 Z" 
                              fill="url(#farmerTrustGradient)" 
                            />

                            {/* Upward-Trending Line */}
                            <path 
                              d="M 5 32 C 25 30, 45 22, 65 15 T 95 6" 
                              fill="none" 
                              stroke="#556B2F" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                            />

                            {/* Realistic Plotted Data Points */}
                            <circle cx="5" cy="32" r="2" fill="#556B2F" />
                            <circle cx="35" cy="26" r="2" fill="#556B2F" />
                            <circle cx="65" cy="15" r="2" fill="#556B2F" />
                            
                            {/* Peak Trust Score 92 Point Highlight */}
                            <circle cx="95" cy="6" r="3.5" fill="#3D4E2A" stroke="#ffffff" strokeWidth="1.5" />
                          </svg>
                          <button 
                            onClick={() => handleSelectFarmerTab('ai-trust')}
                            className="px-3.5 py-2 rounded-xl bg-white border border-[#E6E1D5] text-xs font-bold text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* AI Verification Checkpoints Header */}
                      <div className="space-y-2.5">
                        <span className="text-[11px] font-extrabold text-[#8C8275] uppercase tracking-wider block">
                          AI VERIFICATION CHECKPOINTS
                        </span>

                        {/* Checkpoint Rows */}
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> Cold Chain Integrity
                            </span>
                            <span className="font-extrabold text-[#354424]">100% Compliant (16–20°C Range)</span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> GPS Telemetry Validation
                            </span>
                            <span className="font-extrabold text-[#354424]">Route Verified & Continuous</span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> Tamper Prevention
                            </span>
                            <span className="font-extrabold text-[#354424]">Smart Seal Intact</span>
                          </div>

                          <div className="p-3 rounded-xl bg-[#FAF7F0]/80 border border-[#E6E1D5]/60 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-[#2D2620]">
                              <span className="text-[#556B2F] font-extrabold">✓</span> Anomaly Check
                            </span>
                            <span className="font-extrabold text-[#354424]">0 Deviations Flagged</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {farmerTab === 'my-crops' && <MyCropsView categories={cropCategories} onSelectCategory={handleSelectCategory} />}
            {farmerTab === 'crop-details' && <CropDetailsView category={selectedCropCategory} onBack={() => handleSelectFarmerTab('my-crops')} />}
            {farmerTab === 'inventory' && <FarmerInventoryView items={inventoryList} onOpenAddStock={() => setIsAddStockOpen(true)} />}
            {farmerTab === 'orders' && <FarmerOrdersView />}
            {farmerTab === 'shipments' && <FarmerShipmentsView onViewJourney={() => setIsJourneyOpen(true)} />}
            {farmerTab === 'traceability' && <FarmerTraceabilityView onViewJourney={() => setIsJourneyOpen(true)} />}
            {farmerTab === 'ai-trust' && <AITrustView />}
            {farmerTab === 'earnings' && <EarningsView />}
            {farmerTab === 'profile' && <FarmerProfileView />}
          </main>

          <FarmerBottomNav currentTab={farmerTab} onSelectTab={handleSelectFarmerTab} onOpenMore={() => setIsMoreOpen(true)} />
        </>
      )}

      {/* ========================================== */}
      {/* 3. DARK STORE PORTAL VIEW                  */}
      {/* ========================================== */}
      {activeRole === 'darkstore' && (
        <DarkStoreApp />
      )}

      {/* ========================================== */}
      {/* 4. CONSUMER PORTAL VIEW                    */}
      {/* ========================================== */}
      {activeRole === 'consumer' && (
        <div className="w-full min-h-screen flex-1 bg-[#FAF7F0]">
          <ConsumerApp onLogout={(role) => {
            if (role) setActiveRole(role);
            else handleLogout();
          }} />
        </div>
      )}

      {/* Shared Modals */}
      <MoreMenuSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} onSelectTab={handleSelectFarmerTab} currentTab={farmerTab} />
      <AddStockModal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} onAddStock={handleAddStock} />
      <ViewJourneyModal isOpen={isJourneyOpen} onClose={() => setIsJourneyOpen(false)} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
}
