import React, { useState } from 'react';
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
import { RevenueView } from './Views/RevenueView';
import { ProfileView } from './Views/ProfileView';

// Modals
import { CouponModal } from './Modals/CouponModal';
import { OrderSuccessModal } from './Modals/OrderSuccessModal';
import { WriteReviewModal } from './Modals/WriteReviewModal';
import { QRScannerModal } from './Modals/QRScannerModal';
import { AddressModal } from './Modals/AddressModal';
import { NotificationsModal } from './Modals/NotificationsModal';

// Initial Data
import { initialCartItems } from './data/consumerData';
import { CheckCircle2 } from 'lucide-react';

export const ConsumerApp = ({ onLogout }) => {
  // Onboarding is the default Consumer launch screen
  const [activeView, setActiveView] = useState('onboarding');
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [deliveryAddress, setDeliveryAddress] = useState('Nashik, Maharashtra');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedJourneyProduct, setSelectedJourneyProduct] = useState(null);

  // Modals state
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
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

  const handleCheckout = () => {
    setIsOrderSuccessOpen(true);
    setCartItems([]);
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
          showToast("Welcome back! Entering AgriChain...");
          setActiveView('home');
        }}
      />
    );
  }

  return (
    <MobileContainer>
      {/* Top-Right Role Switcher Floating Bar (Restored on Consumer Dashboard Only) */}
      <div className="fixed top-3 right-4 sm:right-6 z-50 flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E6E1D5] shadow-sm">
        <button
          onClick={() => onLogout && onLogout('farmer')}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 text-[#666057] hover:text-[#2D2620]"
        >
          <span>🌿</span>
          <span>Farmer</span>
        </button>
        <button
          onClick={() => onLogout && onLogout('logistics')}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 text-[#666057] hover:text-[#2D2620]"
        >
          <span>🚛</span>
          <span>Logistics Partner</span>
        </button>
        <button
          onClick={() => onLogout && onLogout('darkstore')}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 text-[#666057] hover:text-[#2D2620]"
        >
          <span>🏬</span>
          <span>Dark Store</span>
        </button>
        <button
          onClick={() => onLogout && onLogout('consumer')}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 bg-[#354424] text-white shadow-xs"
        >
          <span>🛒</span>
          <span>Consumer</span>
        </button>
      </div>

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
          />
        )}

        {activeView === 'orders' && (
          <OrdersView
            onBack={() => setActiveView('home')}
            onViewOrderDetails={(order) => {
              if (order && order.items && order.items.length > 0) {
                const firstItemName = order.items[0].name;
                const matchedProduct = initialCartItems.find(p => p.name === firstItemName) || {
                  name: firstItemName,
                  batchId: 'TM1256',
                  origin: 'Nashik, Maharashtra',
                  image: '/images/vegetables_ref.png'
                };
                handleProductClickForJourney(matchedProduct);
              } else {
                setActiveView('journey');
              }
            }}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'scan' && (
          <ScanProductView
            onBack={() => setActiveView('home')}
            onScanSuccess={() => setActiveView('journey')}
            onEnterCodeClick={() => setIsQRModalOpen(true)}
          />
        )}

        {activeView === 'journey' && (
          <ProductJourneyView
            selectedProduct={selectedJourneyProduct}
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

        {activeView === 'revenue' && (
          <RevenueView
            onBack={() => setActiveView('profile')}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'profile' && (
          <ProfileView
            onBack={() => setActiveView('home')}
            onNavigate={(view) => {
              if (view === 'favorites') setActiveView('favorites');
              else if (view === 'revenue') setActiveView('revenue');
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
        onSubmitReview={() => showToast('Review submitted successfully!')}
      />

      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onFindBatch={(code) => {
          const matched = {
            name: code === 'TM1256' ? 'Organic Tomato' : 'Alphonso Mango',
            batchId: code || 'TM1256',
            origin: code === 'TM1256' ? 'Nashik, Maharashtra' : 'Ratnagiri, Maharashtra',
            image: code === 'TM1256' ? '/images/vegetables_ref.png' : '/images/fruits_ref.png'
          };
          handleProductClickForJourney(matched);
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
      />
    </MobileContainer>
  );
};
