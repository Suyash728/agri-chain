import React, { useState, useEffect } from 'react';
import { MobileContainer } from './components/MobileContainer';
import { ConsumerHeader } from './components/ConsumerHeader';
import { ConsumerBottomNav } from './components/ConsumerBottomNav';

// Views
import { OnboardingView } from './Views/OnboardingView';
import { HomeView } from './Views/HomeView';
import { CategoriesView } from './Views/CategoriesView';
import { ProductsView } from './Views/ProductsView';
import { CartView } from './Views/CartView';
import { OrdersView } from './Views/OrdersView';
import { ScanProductView } from './Views/ScanProductView';
import { ProductJourneyView } from './Views/ProductJourneyView';
import { FavoritesView } from './Views/FavoritesView';
import { BlockchainVerificationView } from './Views/BlockchainVerificationView';
import { ProfileView } from './Views/ProfileView';

// Modals
import { CouponModal } from './Modals/CouponModal';
import { OrderSuccessModal } from './Modals/OrderSuccessModal';
import { WriteReviewModal } from './Modals/WriteReviewModal';
import { QRScannerModal } from './Modals/QRScannerModal';
import { AddressModal } from './Modals/AddressModal';
import { NotificationsModal } from './Modals/NotificationsModal';
import { API_BASE_URL } from '../utils/api';

// Initial Data
import { CheckCircle2 } from 'lucide-react';

export const ConsumerApp = ({ onLogout, currentTab = 'home', onSelectTab, initialBatchId = null }) => {
  const [internalView, setInternalView] = useState('home');
  const activeView = onSelectTab ? currentTab : internalView;
  const setActiveView = (view) => {
    if (onSelectTab) onSelectTab(view);
    else setInternalView(view);
  };
  const [availableBatches, setAvailableBatches] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    try {
      return localStorage.getItem('agrichain_delivery_address') || 'Bandra West, Mumbai';
    } catch {
      return 'Bandra West, Mumbai';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedJourneyProduct, setSelectedJourneyProduct] = useState(
    initialBatchId ? { batchId: initialBatchId, name: 'Produce Batch' } : null
  );

  // Modals state
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  const fetchBatches = () => {
    fetch(`${API_BASE_URL}/batches`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAvailableBatches(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (initialBatchId) {
      const match = availableBatches.find(b => b.batch_id === initialBatchId);
      if (match) {
        const isFruit = ['mango', 'banana', 'apple'].some(f => (match.crop_name || match.name || '').toLowerCase().includes(f));
        const cleanOrigin = (match.origin_farm || match.origin || 'Nashik, Maharashtra').split('||')[0].trim();
        setSelectedJourneyProduct({
          name: match.crop_name || match.name || 'Organic Produce',
          batchId: match.batch_id,
          origin: cleanOrigin,
          image: isFruit ? '/images/fruits_ref.png' : '/images/vegetables_ref.png'
        });
      } else {
        setSelectedJourneyProduct({
          name: 'Organic Produce',
          batchId: initialBatchId,
          origin: 'Nashik, Maharashtra',
          image: '/images/vegetables_ref.png'
        });
      }
      setActiveView('journey');
    }
  }, [initialBatchId, availableBatches]);

  useEffect(() => {
    fetchBatches();
    const handleReset = () => {
      fetchBatches();
      setSelectedJourneyProduct(null);
    };
    const handleAddressChanged = (e) => {
      if (e.detail?.address) {
        setDeliveryAddress(e.detail.address);
      }
    };
    window.addEventListener('agrichain-data-reset', handleReset);
    window.addEventListener('agrichain-data-updated', fetchBatches);
    window.addEventListener('agrichain-address-changed', handleAddressChanged);
    return () => {
      window.removeEventListener('agrichain-data-reset', handleReset);
      window.removeEventListener('agrichain-data-updated', fetchBatches);
      window.removeEventListener('agrichain-address-changed', handleAddressChanged);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleReviewSubmit = async (review) => {
    const batchId = selectedJourneyProduct?.batchId || availableBatches[0]?.batch_id || 'BATCH-001';
    try {
      const res = await fetch(`${API_BASE_URL}/batches/${batchId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: review.rating,
          comment: review.comment,
          freshness_score: 95,
          reviewer_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        }),
      });
      if (res.ok) {
        showToast('Review submitted & verified on-chain!');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Review recorded!');
      }
    } catch (e) {
      showToast('Review recorded!');
    }
    setReviewRefreshKey((k) => k + 1);
  };

  // Cart Handlers
  const handleAddToCart = (product) => {
    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        batchId: product.batchId,
        name: product.name,
        weight: product.weight,
        price: product.price,
        quantity: 1,
        image: product.image
      }]);
    }
    showToast(`Added ${product.name} to cart!`);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
    } else {
      setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    }
  };

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
    showToast(`Item removed from cart`);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const discount = appliedCoupon ? Math.round(subtotal * 0.2) : 0;
      const grandTotal = Math.max(0, subtotal - discount + (subtotal > 0 ? 20 : 0));

      const res = await fetch('http://localhost:8000/consumer/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          delivery_address: deliveryAddress,
          applied_coupon: appliedCoupon,
          total_amount: grandTotal,
        }),
      });

      if (res.ok) {
        setIsOrderSuccessOpen(true);
        setCartItems([]);
        showToast('Order confirmed! Tracking dispatch.');
        window.dispatchEvent(new CustomEvent('agrichain-data-updated'));
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.detail || 'Checkout failed. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('Checkout connection error.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategoryFilter(catId);
    setActiveView('products');
  };

  // Dynamic Product Journey Handler
  const handleProductClickForJourney = (product) => {
    if (product) {
      setSelectedJourneyProduct(product);
    }
    setActiveView('journey');
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Full-Screen Mobile/Desktop Onboarding Landing Page (First Screen on App Launch)
  if (activeView === 'onboarding') {
    return (
      <OnboardingView
        activeRole="consumer"
        onSelectRole={(role) => {
          if (onLogout) onLogout(role);
        }}
        onGetStarted={() => setActiveView('home')}
        onContinueAsGuest={() => setActiveView('home')}
        onLogin={() => {
          if (onLogout) onLogout();
          else setActiveView('home');
        }}
      />
    );
  }

  return (
    <MobileContainer>
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-16 right-4 sm:right-8 z-50 bg-[#354424] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Zepto-Style Header: Top Header -> Search Bar -> Horizontal Navigation Row */}
      <ConsumerHeader 
        onNotificationClick={() => setIsNotificationsOpen(true)}
        onAddressClick={() => setIsAddressOpen(true)}
        onNavigate={(view) => {
          if (view === 'products') setSelectedCategoryFilter('all');
          setActiveView(view);
        }}
        activeTab={activeView}
        cartCount={totalCartCount}
        deliveryAddress={deliveryAddress}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeView !== 'products') setActiveView('products');
        }}
      />

      {/* Main Page View Router */}
      <div className="flex-1 overflow-y-auto w-full">
        {activeView === 'home' && (
          <HomeView
            onNavigate={(view, catId) => {
              if (catId) {
                setSelectedCategoryFilter(catId);
                setActiveView('products');
              } else if (view === 'categories') setActiveView('categories');
              else if (view === 'products') {
                setSelectedCategoryFilter('all');
                setActiveView('products');
              } else setActiveView(view);
            }}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClickForJourney}
            onNotificationClick={() => setIsNotificationsOpen(true)}
            onAddressClick={() => setIsAddressOpen(true)}
          />
        )}

        {activeView === 'categories' && (
          <CategoriesView
            onBack={() => setActiveView('home')}
            onSelectCategory={handleSelectCategory}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'products' && (
          <ProductsView
            onBack={() => setActiveView('home')}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClickForJourney}
            initialCategory={selectedCategoryFilter}
            searchQuery={searchQuery}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'cart' && (
          <CartView
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onBack={() => setActiveView('home')}
            onCheckout={handleCheckout}
            onApplyCouponClick={() => setIsCouponOpen(true)}
            appliedCoupon={appliedCoupon}
            onNavigate={(view) => setActiveView(view)}
            isSubmitting={isSubmittingOrder}
          />
        )}

        {activeView === 'orders' && (
          <OrdersView
            onBack={() => setActiveView('home')}
            onViewOrderDetails={(order) => {
              const firstItem = order && order.items && order.items[0];
              const matchedProduct = {
                name: firstItem?.name || 'Organic Produce',
                batchId: firstItem?.batchId || order.batchId || 'TM1256',
                origin: firstItem?.farm || 'Nashik, Maharashtra',
                image: order.thumbnails?.[0] || '/images/vegetables_ref.png',
                date: order.date,
                total: order.total
              };
              handleProductClickForJourney(matchedProduct);
            }}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'scan' && (
          <ScanProductView
            onBack={() => setActiveView('home')}
            batches={availableBatches}
            onScanSuccess={(scannedBatch) => {
              const target = scannedBatch || (availableBatches.length > 0 ? availableBatches[0] : null);
              if (target) {
                const isFruit = ['mango', 'banana', 'apple'].some(f => (target.crop_name || target.name || '').toLowerCase().includes(f));
                const cleanOrigin = (target.origin_farm || target.origin || 'Nashik, Maharashtra').split('||')[0].trim();
                setSelectedJourneyProduct({
                  name: target.crop_name || target.name || 'Organic Produce',
                  batchId: target.batch_id || target.batchId,
                  origin: cleanOrigin,
                  image: isFruit ? '/images/fruits_ref.png' : '/images/vegetables_ref.png'
                });
                showToast(`Scanned QR Code for ${target.crop_name || target.name || 'Produce'}!`);
                setActiveView('journey');
              } else {
                setIsQRModalOpen(true);
              }
            }}
            onEnterCodeClick={() => setIsQRModalOpen(true)}
          />
        )}

        {activeView === 'journey' && (
          <ProductJourneyView
            selectedProduct={selectedJourneyProduct}
            refreshKey={reviewRefreshKey}
            onBack={() => setActiveView('home')}
            onVerifyBlockchainClick={(product) => {
              if (product) setSelectedJourneyProduct(product);
              setActiveView('blockchain');
            }}
            onWriteReviewClick={() => setIsWriteReviewOpen(true)}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'favorites' && (
          <FavoritesView
            onBack={() => setActiveView('home')}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClickForJourney}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'blockchain' && (
          <BlockchainVerificationView
            selectedProduct={selectedJourneyProduct}
            onBack={() => setActiveView('journey')}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'profile' && (
          <ProfileView
            onBack={() => setActiveView('home')}
            onNavigate={(view) => {
              if (view === 'favorites') setActiveView('favorites');
              else if (view === 'scan') setActiveView('scan');
              else setActiveView(view);
            }}
            onLogout={onLogout}
          />
        )}
      </div>

      {/* Mobile-Only Bottom Navigation Bar (< md) */}
      <ConsumerBottomNav
        activeTab={['home', 'categories', 'cart', 'orders', 'profile'].includes(activeView) ? activeView : 'home'}
        onSelectTab={(tab) => setActiveView(tab)}
        cartCount={totalCartCount}
      />

      {/* Interactive Modals */}
      <CouponModal
        isOpen={isCouponOpen}
        onClose={() => setIsCouponOpen(false)}
        onApplyCoupon={(code) => {
          setAppliedCoupon(code);
          showToast(`Applied coupon ${code}! 20% discount added.`);
        }}
      />

      <OrderSuccessModal
        isOpen={isOrderSuccessOpen}
        onClose={() => setIsOrderSuccessOpen(false)}
        onViewOrders={() => setActiveView('orders')}
      />

      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        onSubmitReview={handleReviewSubmit}
      />

      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        batches={availableBatches}
        onFindBatch={(found) => {
          if (found && typeof found === 'object' && found.batchId) {
            handleProductClickForJourney(found);
            showToast(`Batch #${found.batchId} verified on blockchain!`);
          } else if (found && typeof found === 'string') {
            const matched = {
              name: 'Organic Produce',
              batchId: found,
              origin: 'Nashik, Maharashtra',
              image: '/images/vegetables_ref.png'
            };
            handleProductClickForJourney(matched);
            showToast(`Batch #${found} loaded!`);
          }
        }}
      />

      <AddressModal
        isOpen={isAddressOpen}
        onClose={() => setIsAddressOpen(false)}
        currentAddress={deliveryAddress}
        onSelectAddress={(addr) => {
          setDeliveryAddress(addr);
          showToast(`Delivery location updated to ${addr}`);
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        role="consumer"
      />
    </MobileContainer>
  );
};
