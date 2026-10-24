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

// Custody Action Modals
import { ConfirmGRNModal } from './Modals/ConfirmGRNModal';
import { RecordSaleModal } from './Modals/RecordSaleModal';

// Shared Modals
import { NotificationsModal } from '../Farmer/Modals/NotificationsModal';
import { MoreMenuSheet } from '../Farmer/Modals/MoreMenuSheet';

export const DarkStoreApp = ({ currentTab, onSelectTab, onLogout }) => {
  const [internalTab, setInternalTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('role') === 'darkstore' && params.get('tab')) {
        return params.get('tab');
      }
      return localStorage.getItem('agrichain_darkstore_tab') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const darkStoreTab = currentTab !== undefined ? currentTab : internalTab;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Custody Action Modals State
  const [isGRNOpen, setIsGRNOpen] = useState(false);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState('');

  const handleOpenGRN = (bId) => {
    setActiveBatchId(bId || '');
    setIsGRNOpen(true);
  };

  const handleOpenRecordSale = (bId) => {
    setActiveBatchId(bId || '');
    setIsRecordSaleOpen(true);
  };

  const handleSelectTab = (tabId) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    } else {
      setInternalTab(tabId);
    }
    try {
      localStorage.setItem('agrichain_darkstore_tab', tabId);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoutAction = onLogout || (() => {
    alert("Logged out of Anand Deshmukh's Dark Store Hub Account.");
  });

  return (
    <>
      <DarkStoreSidebar 
        currentTab={darkStoreTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogoutAction}
      />

      <main className="min-w-0 flex-1 md:ml-64 w-full md:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-8 max-w-7xl pb-24 md:pb-8 pt-4 sm:pt-6">
        {darkStoreTab === 'dashboard' && (
          <DarkStoreDashboardView 
            onSelectTab={handleSelectTab} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenGRN={handleOpenGRN}
            onOpenRecordSale={handleOpenRecordSale}
          />
        )}
        
        {(darkStoreTab === 'incoming-deliveries' || darkStoreTab === 'inbound') && (
          <InboundGRNView 
            onBack={() => handleSelectTab('dashboard')} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenGRN={handleOpenGRN}
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

        {(darkStoreTab === 'analytics' || darkStoreTab === 'revenue' || darkStoreTab === 'earnings') && (
          <DarkStoreRevenueView 
            onBack={() => handleSelectTab('dashboard')} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

        {(darkStoreTab === 'dispatch' || darkStoreTab === 'shipments') && (
          <DispatchView onBack={() => handleSelectTab('dashboard')} />
        )}

        {darkStoreTab === 'traceability' && (
          <DarkStoreTraceabilityView 
            onBack={() => handleSelectTab('dashboard')} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

        {darkStoreTab === 'blockchain-verification' && (
          <DarkStoreBlockchainView 
            onBack={() => handleSelectTab('dashboard')} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

        {darkStoreTab === 'profile' && (
          <DarkStoreProfileView onBack={() => handleSelectTab('dashboard')} onLogout={handleLogoutAction} />
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
        role="darkstore"
      />

      {/* Shared Mobile More Sheet */}
      <MoreMenuSheet 
        isOpen={isMoreOpen} 
        onClose={() => setIsMoreOpen(false)} 
        onSelectTab={handleSelectTab}
        onLogout={handleLogoutAction}
      />

      {/* Custody Action Modals */}
      <ConfirmGRNModal
        isOpen={isGRNOpen}
        onClose={() => setIsGRNOpen(false)}
        defaultBatchId={activeBatchId}
      />

      <RecordSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => setIsRecordSaleOpen(false)}
        defaultBatchId={activeBatchId}
      />
    </>
  );
};
