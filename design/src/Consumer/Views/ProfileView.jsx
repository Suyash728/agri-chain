import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  FileText, 
  LogOut,
  ChevronRight,
  X,
  Check,
  Plus,
  Trash2,
  Edit3,
  PhoneCall,
  MessageSquare,
  Search,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { userProfileData } from '../data/consumerData';

export const ProfileView = ({ onNavigate, onLogout }) => {
  const [activeModal, setActiveModal] = useState(null); // 'personal' | 'addresses' | 'payment' | 'notifications' | 'help' | 'terms' | 'logout' | null
  const [toastMessage, setToastMessage] = useState('');

  // 1. Personal Information State
  const [profile, setProfile] = useState({
    name: userProfileData.name || 'Rahul Patil',
    email: userProfileData.email || 'rahul.patil@agrichain.com',
    phone: userProfileData.phone || '+91 98201 45892',
    location: userProfileData.location || 'Bandra West, Mumbai',
    preferredLanguage: 'English',
    memberSince: 'March 2024'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // 2. Addresses State
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      title: 'Home (Primary)',
      address: 'Flat 402, Green Valley Apartments, Hill Road, Bandra West',
      city: 'Mumbai',
      pincode: '400050',
      isDefault: true
    },
    {
      id: 'addr-2',
      title: 'Office',
      address: 'Tech Park, Tower B, 5th Floor, Lower Parel',
      city: 'Mumbai',
      pincode: '400013',
      isDefault: false
    }
  ]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ title: '', address: '', city: 'Mumbai', pincode: '' });

  // 3. Payment Methods State
  const [payments, setPayments] = useState([
    { id: 'pay-1', type: 'wallet', title: 'AgriChain Cash Wallet', detail: 'Balance: ₹ 1,250', isDefault: true },
    { id: 'pay-2', type: 'upi', title: 'Google Pay / UPI', detail: 'rahul.patil@okaxis', isDefault: false },
    { id: 'pay-3', type: 'card', title: 'HDFC Bank Credit Card', detail: '•••• •••• •••• 4892', isDefault: false }
  ]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newUpi, setNewUpi] = useState('');

  // 4. Notifications State
  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    whatsappUpdates: true,
    farmTraceability: true,
    priceOffers: false,
    weeklyNewsletter: true
  });

  // 5. Help & Support State
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [ticketSent, setTicketSent] = useState(false);

  // Helper Toast Notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const menuOptions = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText }
  ];

  // Address Handlers
  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddr.title || !newAddr.address || !newAddr.pincode) return;
    const created = {
      id: `addr-${Date.now()}`,
      title: newAddr.title,
      address: newAddr.address,
      city: newAddr.city || 'Mumbai',
      pincode: newAddr.pincode,
      isDefault: false
    };
    setAddresses([...addresses, created]);
    setNewAddr({ title: '', address: '', city: 'Mumbai', pincode: '' });
    setShowAddAddress(false);
    triggerToast('New delivery address added!');
  };

  const handleDeleteAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
    triggerToast('Address removed.');
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    triggerToast('Default address updated!');
  };

  // Payment Handlers
  const handleAddUpiSubmit = (e) => {
    e.preventDefault();
    if (!newUpi.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. name@upi)');
      return;
    }
    const created = {
      id: `pay-${Date.now()}`,
      type: 'upi',
      title: 'UPI Payment',
      detail: newUpi,
      isDefault: false
    };
    setPayments([...payments, created]);
    setNewUpi('');
    setShowAddPayment(false);
    triggerToast('New UPI payment method added!');
  };

  // FAQs
  const faqsList = [
    {
      q: 'How is farm transparency and blockchain traceability verified?',
      a: 'Every produce batch harvested by AgriChain partner farmers is logged on-chain with GPS geolocation, harvest timestamp, soil quality data, and lab testing certificates. Scanning the QR code on your product package reveals this unalterable digital journey.'
    },
    {
      q: 'What is AgriChain’s 100% Freshness & Quality Guarantee?',
      a: 'We guarantee that all fruits, vegetables, and grains are sourced directly from verified organic farms within 24 hours of harvest. If any item is damaged or sub-standard, you can request an instant 1-click refund or replacement within 24 hours of delivery.'
    },
    {
      q: 'How are farmer earnings calculated and distributed?',
      a: 'AgriChain eliminates middleman markups. Farmers receive 80-85% of the consumer sale price directly into their linked bank accounts via smart contract settlement as soon as delivery is verified.'
    },
    {
      q: 'What payment options are accepted on AgriChain?',
      a: 'We support AgriChain Cash Wallet, UPI (Google Pay, PhonePe, Paytm), All Major Debit & Credit Cards, Net Banking, and Cash on Delivery (COD).'
    }
  ];

  const filteredFaqs = faqsList.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()));

  // Logout Handler
  const handleConfirmLogout = () => {
    setActiveModal(null);
    triggerToast('Logged out from AgriChain successfully.');
    if (onLogout) {
      setTimeout(() => {
        onLogout();
      }, 800);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-8 pt-2 relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#354424] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="px-4 md:px-8 flex flex-col gap-5 mt-2 max-w-7xl mx-auto w-full">
        <h2 className="text-lg md:text-xl font-black text-[#2D2620]">Account & Profile Settings</h2>

        {/* 2-Column Responsive Layout on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Column (1/3): User Profile Card */}
          <div className="md:col-span-1 bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs flex flex-col items-center text-center gap-3">
            {/* Avatar Graphic */}
            <div className="w-24 h-24 rounded-full bg-[#354424] p-1 shadow-md relative overflow-hidden flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#FAF7F0] flex items-center justify-center overflow-hidden border-2 border-white">
                <img src="/images/fruits_ref.png" alt={profile.name} className="w-16 h-16 object-contain" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-[#2D2620]">{profile.name}</h3>
              <span className="text-xs font-semibold text-[#666057]">{profile.location}</span>
            </div>

            <div className="flex flex-col gap-1 text-xs font-semibold text-[#666057] pt-3 border-t border-[#F4F5E6] w-full">
              <span>{profile.email}</span>
              <span>{profile.phone}</span>
              <span className="mt-1 text-[11px] text-[#556B2F] font-bold bg-[#EBF3E8] py-1 px-3 rounded-full self-center">
                🌱 Verified Member since {profile.memberSince}
              </span>
            </div>

            <button
              onClick={() => setActiveModal('personal')}
              className="mt-2 text-xs font-extrabold text-[#354424] bg-[#FAF7F0] border border-[#E6E1D5] px-4 py-2 rounded-xl hover:bg-[#EBF3E8] transition-colors w-full cursor-pointer flex items-center justify-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Right Column (2/3): Account Menu Options Grid */}
          <div className="md:col-span-2 bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-3">
            <h3 className="font-extrabold text-sm text-[#2D2620] pb-2 border-b border-[#F4F5E6]">
              Account Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {menuOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveModal(opt.id)}
                    className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F0] active:bg-[#EBF3E8] rounded-xl transition-colors cursor-pointer border border-[#F4F5E6] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF7F0] flex items-center justify-center text-[#354424] border border-[#E6E1D5] group-hover:bg-[#354424] group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#2D2620]">{opt.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#666057] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setActiveModal('logout')}
              className="mt-2 p-3.5 flex items-center justify-between text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-100 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-200 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-extrabold">Logout from AgriChain</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Personal Information */}
      {/* ========================================================================= */}
      {activeModal === 'personal' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F4F5E6] pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#354424]" />
                <h3 className="font-black text-base text-[#2D2620]">Personal Information</h3>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setIsEditingProfile(false); }}
                className="w-8 h-8 rounded-full hover:bg-[#FAF7F0] flex items-center justify-center text-[#666057] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditingProfile ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsEditingProfile(false);
                  triggerToast('Personal profile saved successfully!');
                }}
                className="flex flex-col gap-3 text-xs"
              >
                <div>
                  <label className="font-extrabold text-[#2D2620] mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                    required
                  />
                </div>
                <div>
                  <label className="font-extrabold text-[#2D2620] mb-1 block">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                    required
                  />
                </div>
                <div>
                  <label className="font-extrabold text-[#2D2620] mb-1 block">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                    required
                  />
                </div>
                <div>
                  <label className="font-extrabold text-[#2D2620] mb-1 block">City / Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#F4F5E6]">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-xl border border-[#E6E1D5] text-[#666057] font-bold cursor-pointer hover:bg-[#FAF7F0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#354424] text-white font-extrabold cursor-pointer hover:bg-[#2D3B1E]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 text-xs">
                <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#E6E1D5] flex flex-col gap-2.5">
                  <div className="flex justify-between items-center border-b border-[#E6E1D5] pb-2">
                    <span className="font-semibold text-[#666057]">Full Name</span>
                    <span className="font-extrabold text-[#2D2620]">{profile.name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#E6E1D5] pb-2">
                    <span className="font-semibold text-[#666057]">Email Address</span>
                    <span className="font-extrabold text-[#2D2620]">{profile.email}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#E6E1D5] pb-2">
                    <span className="font-semibold text-[#666057]">Phone Number</span>
                    <span className="font-extrabold text-[#2D2620]">{profile.phone}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#E6E1D5] pb-2">
                    <span className="font-semibold text-[#666057]">Location</span>
                    <span className="font-extrabold text-[#2D2620]">{profile.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#666057]">Account Status</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                      Verified Consumer
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#354424] text-white font-extrabold cursor-pointer hover:bg-[#2D3B1E] flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Information</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Addresses */}
      {/* ========================================================================= */}
      {activeModal === 'addresses' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F4F5E6] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#354424]" />
                <h3 className="font-black text-base text-[#2D2620]">Delivery Addresses</h3>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setShowAddAddress(false); }}
                className="w-8 h-8 rounded-full hover:bg-[#FAF7F0] flex items-center justify-center text-[#666057] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address List */}
            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <div 
                  key={addr.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    addr.isDefault ? 'border-[#354424] bg-[#EBF3E8]/50' : 'border-[#E6E1D5] bg-[#FAF7F0]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#2D2620]">{addr.title}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-[#354424] text-white text-[10px] font-black">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#666057] font-semibold leading-relaxed">
                    {addr.address}, {addr.city} - {addr.pincode}
                  </p>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="self-start text-[11px] font-bold text-[#354424] hover:underline cursor-pointer pt-1"
                    >
                      Make Default Address
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Address Form Toggle */}
            {showAddAddress ? (
              <form onSubmit={handleAddAddressSubmit} className="flex flex-col gap-3 text-xs pt-3 border-t border-[#F4F5E6]">
                <h4 className="font-black text-xs text-[#2D2620]">Add New Address</h4>
                <input
                  type="text"
                  placeholder="Address Tag (e.g. Home, Office, Farm)"
                  value={newAddr.title}
                  onChange={(e) => setNewAddr({ ...newAddr, title: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620]"
                  required
                />
                <textarea
                  placeholder="Street Address, House/Flat No, Landmark"
                  value={newAddr.address}
                  onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620] h-20 resize-none"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={newAddr.pincode}
                    onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-4 py-2 rounded-xl border border-[#E6E1D5] text-[#666057] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#354424] text-white font-extrabold cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddAddress(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#E6E1D5] hover:border-[#354424] text-[#354424] font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Delivery Address</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Payment Methods */}
      {/* ========================================================================= */}
      {activeModal === 'payment' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F4F5E6] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#354424]" />
                <h3 className="font-black text-base text-[#2D2620]">Payment Methods</h3>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setShowAddPayment(false); }}
                className="w-8 h-8 rounded-full hover:bg-[#FAF7F0] flex items-center justify-center text-[#666057] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {payments.map((p) => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#354424] border border-[#E6E1D5]">
                      {p.type === 'wallet' ? <Smartphone className="w-4 h-4 text-emerald-700" /> : <CreditCard className="w-4 h-4 text-[#354424]" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-xs text-[#2D2620]">{p.title}</span>
                      <span className="text-[11px] font-semibold text-[#666057]">{p.detail}</span>
                    </div>
                  </div>
                  {p.isDefault ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3E8] text-[#556B2F] text-[10px] font-black">
                      ACTIVE
                    </span>
                  ) : (
                    <button 
                      onClick={() => {
                        setPayments(payments.map(item => ({ ...item, isDefault: item.id === p.id })));
                        triggerToast('Primary payment method set!');
                      }}
                      className="text-[11px] font-bold text-[#354424] hover:underline cursor-pointer"
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              ))}
            </div>

            {showAddPayment ? (
              <form onSubmit={handleAddUpiSubmit} className="flex flex-col gap-3 text-xs pt-3 border-t border-[#F4F5E6]">
                <h4 className="font-black text-xs text-[#2D2620]">Add UPI ID</h4>
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g. mobile@upi)"
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold text-[#2D2620]"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(false)}
                    className="px-4 py-2 rounded-xl border border-[#E6E1D5] text-[#666057] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#354424] text-white font-extrabold cursor-pointer"
                  >
                    Save UPI
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddPayment(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#E6E1D5] hover:border-[#354424] text-[#354424] font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New UPI ID / Card</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Notifications */}
      {/* ========================================================================= */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F4F5E6] pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#354424]" />
                <h3 className="font-black text-base text-[#2D2620]">Notification Settings</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-[#FAF7F0] flex items-center justify-center text-[#666057] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {[
                { key: 'orderAlerts', title: 'Order Status & Live Delivery Alerts', desc: 'Real-time SMS and push updates when orders are dispatched' },
                { key: 'whatsappUpdates', title: 'WhatsApp Direct Notifications', desc: 'Receive invoice & delivery tracking link directly on WhatsApp' },
                { key: 'farmTraceability', title: 'Farm Traceability & Harvest Stories', desc: 'Alerts when fresh crops from your followed farmers are harvested' },
                { key: 'priceOffers', title: 'Fresh Produce Discounts & Offers', desc: 'Promotional codes and flash sale notifications on fruits & vegetables' }
              ].map((item) => (
                <div key={item.key} className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-[#2D2620]">{item.title}</span>
                    <span className="text-[11px] font-semibold text-[#666057]">{item.desc}</span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => {
                      setNotifications({ ...notifications, [item.key]: !notifications[item.key] });
                      triggerToast('Notification preference updated!');
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 ${
                      notifications[item.key] ? 'bg-[#354424]' : 'bg-[#D1C9B8]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F4F5E6]">
              <button
                onClick={() => {
                  setActiveModal(null);
                  triggerToast('Preferences saved!');
                }}
                className="px-5 py-2 rounded-xl bg-[#354424] text-white font-extrabold cursor-pointer hover:bg-[#2D3B1E]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Help & Support */}
      {/* ========================================================================= */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F4F5E6] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#354424]" />
                <h3 className="font-black text-base text-[#2D2620]">Help & Support Center</h3>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setTicketSent(false); }}
                className="w-8 h-8 rounded-full hover:bg-[#FAF7F0] flex items-center justify-center text-[#666057] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Contact Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="tel:1800-419-8800"
                className="p-3 rounded-2xl bg-[#EBF3E8] border border-[#C5DCBD] text-[#354424] font-extrabold flex items-center justify-center gap-2 hover:bg-[#354424] hover:text-white transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Helpline</span>
              </a>
              <a
                href="https://wa.me/919820145892"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-[#EBF3E8] border border-[#C5DCBD] text-[#354424] font-extrabold flex items-center justify-center gap-2 hover:bg-[#354424] hover:text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Chat</span>
              </a>
            </div>

            {/* FAQ Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#666057] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search help topics..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] text-xs font-semibold text-[#2D2620] focus:outline-none"
              />
            </div>

            {/* FAQs Accordion */}
            <div className="flex flex-col gap-2 text-xs">
              <h4 className="font-extrabold text-xs text-[#2D2620]">Frequently Asked Questions</h4>
              {filteredFaqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full p-3 text-left font-bold text-[#2D2620] flex items-center justify-between hover:bg-[#EBF3E8]/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#666057] transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-3 pb-3 text-[11px] font-semibold text-[#666057] leading-relaxed border-t border-[#E6E1D5] pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Support Ticket Form */}
            <div className="pt-3 border-t border-[#F4F5E6] flex flex-col gap-2">
              <h4 className="font-extrabold text-xs text-[#2D2620]">Raise a Support Ticket</h4>
              {ticketSent ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ticket #TK-9921 submitted! Our team will contact you shortly.</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!ticketForm.message) return;
                    setTicketSent(true);
                    setTicketForm({ subject: '', message: '' });
                    triggerToast('Support ticket created!');
                  }}
                  className="flex flex-col gap-2 text-xs"
                >
                  <input
                    type="text"
                    placeholder="Issue Subject (e.g. Delayed Order, Quality issue)"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold"
                    required
                  />
                  <textarea
                    placeholder="Describe your issue or feedback in detail..."
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[#E6E1D5] bg-[#FAF7F0] font-semibold h-16 resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="py-2 bg-[#354424] text-white rounded-xl font-extrabold cursor-pointer hover:bg-[#2D3B1E]"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Terms & Conditions */}
      {/* ========================================================================= */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F4F5E6] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#354424]" />
                <h3 className="font-black text-base text-[#2D2620]">Terms & Conditions</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-[#FAF7F0] flex items-center justify-center text-[#666057] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-[#666057] font-semibold leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E6E1D5]">
                <h4 className="font-extrabold text-[#2D2620] mb-1">1. Direct-from-Farmer Guarantee</h4>
                <p>AgriChain guarantees that 100% of produce listed on our consumer portal is sourced directly from registered partner farmers with transparent blockchain origin records.</p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E6E1D5]">
                <h4 className="font-extrabold text-[#2D2620] mb-1">2. Pricing & Fair Trade Policy</h4>
                <p>No predatory middleman commissions are applied. Sale prices reflect fair market compensation for farmers + actual cold-chain logistics cost.</p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E6E1D5]">
                <h4 className="font-extrabold text-[#2D2620] mb-1">3. Quality, Weight & Returns</h4>
                <p>Items found to be damaged, spoiled, or incorrect during delivery are eligible for an immediate full refund or replacement under our 24-Hour Produce Freshness Guarantee.</p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E6E1D5]">
                <h4 className="font-extrabold text-[#2D2620] mb-1">4. Privacy & Data Security</h4>
                <p>Your payment credentials, phone number, and address are encrypted with 256-bit SSL encryption and are never sold or shared with unauthorized third parties.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F4F5E6]">
              <button
                onClick={() => {
                  setActiveModal(null);
                  triggerToast('Terms & Conditions Accepted.');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#354424] text-white font-extrabold cursor-pointer hover:bg-[#2D3B1E] flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>I Understand & Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: Logout Confirmation */}
      {/* ========================================================================= */}
      {activeModal === 'logout' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-2xl max-w-sm w-full flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>

            <div>
              <h3 className="font-black text-base text-[#2D2620]">Log out of AgriChain?</h3>
              <p className="text-xs text-[#666057] font-semibold mt-1">
                You are currently signed in as <span className="font-bold text-[#2D2620]">{profile.name}</span> ({profile.email}).
              </p>
            </div>

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E6E1D5] text-[#666057] font-bold text-xs hover:bg-[#FAF7F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-extrabold text-xs hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
