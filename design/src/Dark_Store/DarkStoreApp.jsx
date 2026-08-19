import React, { useState } from 'react';
import { DarkStoreSidebar } from './components/DarkStoreSidebar';
import { DarkStoreBottomNav } from './components/DarkStoreBottomNav';

// Dark Store Views
import { DarkStoreDashboardView } from './Views/DarkStoreDashboardView';
import { InboundGRNView } from './Views/InboundGRNView';
import { MicroInventoryView } from './Views/MicroInventoryView';
import { FulfillmentOrdersView } from './Views/FulfillmentOrdersView';
import { DispatchView } from './Views/DispatchView';
import { AnalyticsView } from './Views/AnalyticsView';
import { DarkStoreProfileView } from './Views/DarkStoreProfileView';
import { DarkStoreSalesView } from './Views/DarkStoreSalesView';
import { DarkStoreExpiryAlertsView } from './Views/DarkStoreExpiryAlertsView';
import { DarkStoreTraceabilityView } from './Views/DarkStoreTraceabilityView';
import { DarkStoreBlockchainView } from './Views/DarkStoreBlockchainView';
import { DarkStoreRevenueView } from './Views/DarkStoreRevenueView';

// Shared Modals
import { NotificationsModal } from '../Farmer/Modals/NotificationsModal';
import { MoreMenuSheet } from '../Farmer/Modals/MoreMenuSheet';

export const DarkStoreApp = () => {
  const [darkStoreTab, setDarkStoreTab] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleSelectTab = (tabId) => {
    setDarkStoreTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    alert("Logged out of Anand Deshmukh's Dark Store Hub Account.");
  };

  return (
    <>
      <DarkStoreSidebar 
        currentTab={darkStoreTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 pt-14 md:pt-8">
        {darkStoreTab === 'dashboard' && (
          <DarkStoreDashboardView 
            onSelectTab={handleSelectTab} 
            onOpenNotifications={() => setIsNotificationsOpen(true)} 
          />
        )}
        
        {(darkStoreTab === 'incoming-deliveries' || darkStoreTab === 'inbound') && (
          <InboundGRNView 
            onBack={() => handleSelectTab('dashboard')} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

        {darkStoreTab === 'inventory' && (
          <MicroInventoryView onBack={() => handleSelectTab('dashboard')} initialSubTab={1} />
        )}

        {darkStoreTab === 'expiry-alerts' && (
          <DarkStoreExpiryAlertsView onBack={() => handleSelectTab('dashboard')} />
        )}

        {(darkStoreTab === 'products' || darkStoreTab === 'fulfillment') && (
          <MicroInventoryView onBack={() => handleSelectTab('dashboard')} initialSubTab={2} />
        )}

        {darkStoreTab === 'sales' && (
          <DarkStoreSalesView onBack={() => handleSelectTab('dashboard')} />
        )}

        {(darkStoreTab === 'analytics' || darkStoreTab === 'revenue') && (
          <DarkStoreRevenueView onBack={() => handleSelectTab('dashboard')} />
        )}

        {darkStoreTab === 'dispatch' && (
          <DispatchView onBack={() => handleSelectTab('dashboard')} />
        )}

        {darkStoreTab === 'traceability' && (
          <DarkStoreTraceabilityView onBack={() => handleSelectTab('dashboard')} />
        )}

        {darkStoreTab === 'blockchain-verification' && (
          <DarkStoreBlockchainView onBack={() => handleSelectTab('dashboard')} />
        )}

        {darkStoreTab === 'profile' && (
          <DarkStoreProfileView onBack={() => handleSelectTab('dashboard')} onLogout={handleLogout} />
        )}
      </main>

      <DarkStoreBottomNav 
        currentTab={darkStoreTab}
        onSelectTab={handleSelectTab}
        onOpenMore={() => setIsMoreOpen(true)}
      />

      {/* Shared Notifications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />

      {/* Shared Mobile More Sheet */}
      <MoreMenuSheet 
        isOpen={isMoreOpen} 
        onClose={() => setIsMoreOpen(false)} 
      />
    </>
  );
};
