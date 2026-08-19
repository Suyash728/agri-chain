import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Link2, 
  Search, 
  QrCode, 
  Calendar, 
  ChevronDown, 
  Bell, 
  CheckCircle2, 
  Truck, 
  Factory, 
  Store, 
  Sprout, 
  MapPin, 
  FileText, 
  Download, 
  Eye, 
  X, 
  Camera,
  Check
} from 'lucide-react';

export const DarkStoreTraceabilityView = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('BATCH-VEG-100525');
  const [activeStore, setActiveStore] = useState('Nashik Central Store');
  const [selectedDate, setSelectedDate] = useState('12 May, 2025');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeDocModal, setActiveDocModal] = useState(null);

  // Sample Batches Dataset for live search
  const batchDataMap = {
    'BATCH-VEG-100525': {
      batchId: 'BATCH-VEG-100525',
      product: 'Tomatoes (Grade A)',
      quantity: '230 kg',
      supplier: 'Fresh Veg Traders',
      farmLocation: 'Nashik, Maharashtra',
      harvestDate: '09 May, 2025',
      packagingDate: '10 May, 2025',
      expiryDate: '17 May, 2025',
      currentLocation: 'Nashik Central Store',
    },
    'BATCH-FRU-200840': {
      batchId: 'BATCH-FRU-200840',
      product: 'Alphonso Mangoes',
      quantity: '180 kg',
      supplier: 'Green Valley Farms',
      farmLocation: 'Ratnagiri, Maharashtra',
      harvestDate: '08 May, 2025',
      packagingDate: '09 May, 2025',
      expiryDate: '22 May, 2025',
      currentLocation: 'Nashik Central Store',
    },
    'BATCH-GRA-300120': {
      batchId: 'BATCH-GRA-300120',
      product: 'Moong Dal / Green Gram',
      quantity: '310 kg',
      supplier: 'Daily Needs Organic Farm',
      farmLocation: 'Aurangabad, Maharashtra',
      harvestDate: '01 May, 2025',
      packagingDate: '03 May, 2025',
      expiryDate: '30 Jun, 2025',
      currentLocation: 'Nashik Central Store',
    },
  };

  const activeBatch = batchDataMap[searchQuery.trim().toUpperCase()] || batchDataMap['BATCH-VEG-100525'];

  // 5 Horizontal Journey Timeline Steps
  const journeySteps = [
    {
      id: 'farm',
      title: 'Farm',
      time: '10 May, 07:00 AM',
      location: activeBatch.farmLocation,
      status: 'Completed',
      icon: Sprout,
    },
    {
      id: 'collection',
      title: 'Collection',
      time: '10 May, 09:30 AM',
      location: 'Nashik Collection Hub',
      status: 'Completed',
      icon: Truck,
    },
    {
      id: 'processing',
      title: 'Processing',
      time: '10 May, 11:45 AM',
      location: 'Nashik Processing Unit',
      status: 'Completed',
      icon: Factory,
    },
    {
      id: 'transit',
      title: 'In Transit',
      time: '10 May, 03:20 PM',
      location: 'En Route to Store',
      status: 'Completed',
      icon: Truck,
    },
    {
      id: 'store',
      title: 'Store Received',
      time: '11 May, 08:15 AM',
      location: activeBatch.currentLocation,
      status: 'Completed',
      icon: Store,
    },
  ];

  // 5 Journey Events (Vertical Stepper Timeline)
  const journeyEvents = [
    {
      title: 'Store Received',
      time: '11 May, 08:15 AM',
      desc: `Delivery received at ${activeBatch.currentLocation}`,
      location: activeBatch.currentLocation,
    },
    {
      title: 'In Transit',
      time: '10 May, 03:20 PM',
      desc: 'Out for delivery from Nashik Processing Unit',
      location: `Nashik - ${activeBatch.currentLocation}`,
    },
    {
      title: 'Processing',
      time: '10 May, 11:45 AM',
      desc: 'Quality checked, graded and packed',
      location: 'Nashik Processing Unit',
    },
    {
      title: 'Collection',
      time: '10 May, 09:30 AM',
      desc: 'Collected from farm and received at Nashik Collection Hub',
      location: 'Nashik Collection Hub',
    },
    {
      title: 'Farm',
      time: '10 May, 07:00 AM',
      desc: 'Harvested and packed at farm',
      location: activeBatch.farmLocation,
    },
  ];

  // 4 Documents & Certifications
  const documents = [
    {
      id: 'quality-cert',
      title: 'Quality Certificate',
      bg: 'bg-[#EFF4E9]',
      border: 'border-[#D9E6D3]',
      iconBg: 'bg-[#556B2F]/15 text-[#556B2F]',
      fileType: 'PDF Document (Grade A Quality Seal)',
    },
    {
      id: 'fssai-cert',
      title: 'FSSAI Certificate',
      bg: 'bg-[#FFF4EC]',
      border: 'border-[#FDE3D2]',
      iconBg: 'bg-[#B85C38]/15 text-[#B85C38]',
      fileType: 'FSSAI License #11524021000845',
    },
    {
      id: 'lab-report',
      title: 'Lab Test Report',
      bg: 'bg-[#EEF4FB]',
      border: 'border-[#DCE9FE]',
      iconBg: 'bg-[#2563EB]/15 text-[#2563EB]',
      fileType: 'Lab Test Clearance (Pesticide Free)',
    },
    {
      id: 'transport-receipt',
      title: 'Transport Receipt',
      bg: 'bg-[#F5EEF9]',
      border: 'border-[#E9D5FF]',
      iconBg: 'bg-[#9333EA]/15 text-[#9333EA]',
      fileType: 'Logistics E-Way Bill #EW-8849201',
    },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in w-full">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full pt-1 pb-1">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#EBF3E8] border border-[#D4E4CE] flex items-center justify-center text-[#556B2F]">
              <Link2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">
              Traceability
            </h1>
            <p className="text-xs text-[#666057] mt-0.5 font-medium">
              Track the complete journey of your produce from farm to your dark store.
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Bell Notification Button */}
          <button 
            onClick={() => alert('3 new blockchain traceability verification events recorded today!')}
            className="relative p-2.5 rounded-2xl bg-white border border-[#E6E1D5] text-[#2D2620] hover:bg-[#FAF7F0] cursor-pointer shadow-xs"
          >
            <Bell className="w-4 h-4 text-[#2D2620]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#556B2F] text-white text-[10px] font-black flex items-center justify-center">
              3
            </span>
          </button>

          {/* Date Range Selector Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620]">
            <span>{selectedDate}</span>
            <Calendar className="w-4 h-4 text-[#666057]" />
          </div>

          {/* Store Location Dropdown */}
          <div className="relative">
            <select 
              value={activeStore}
              onChange={(e) => setActiveStore(e.target.value)}
              className="appearance-none bg-white border border-[#E6E1D5] rounded-2xl px-4 py-2 pr-8 text-xs font-bold text-[#2D2620] cursor-pointer focus:outline-none shadow-xs hover:border-[#354424] transition-colors"
            >
              <option value="Nashik Central Store">Store: Nashik Central Store</option>
              <option value="Pune Dark Store #04">Store: Pune Dark Store #04</option>
              <option value="Mumbai Micro Hub #12">Store: Mumbai Micro Hub #12</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#666057] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ROW 1: SEARCH & QR SCANNER (2 CARDS)       */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* Left Card: Search by Batch / QR / Product */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-base font-extrabold text-[#2D2620]">Search by Batch / QR / Product</h2>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Batch ID, QR Code or Product Name"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] placeholder-[#8C8275] focus:outline-none focus:border-[#354424] transition-colors"
              />
              <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={() => {
                if (!batchDataMap[searchQuery.trim().toUpperCase()]) {
                  alert(`Batch "${searchQuery}" not found. Try searching BATCH-VEG-100525, BATCH-FRU-200840, or BATCH-GRA-300120.`);
                }
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#354424] text-white text-xs font-extrabold flex items-center gap-2 hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Track Now</span>
            </button>
          </div>
        </div>

        {/* Right Card: Scan QR Code */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex items-center justify-between">
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-extrabold text-[#2D2620]">Scan QR Code</h2>
              <p className="text-xs text-[#666057] mt-0.5 font-medium">Scan the QR code on the product / package</p>
            </div>

            <button 
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 rounded-2xl bg-white border border-[#E6E1D5] text-[#2D2620] text-xs font-extrabold flex items-center gap-2 hover:bg-[#FAF7F0] transition-colors cursor-pointer shadow-2xs"
            >
              <QrCode className="w-4 h-4 text-[#354424]" />
              <span>Open Scanner</span>
            </button>
          </div>

          {/* Green QR Code Vector Graphic Artwork matching reference screenshot */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center p-1 border-2 border-dashed border-[#88A070]/60 rounded-2xl bg-[#EBF3E8]/40">
            <QrCode className="w-12 h-12 text-[#88A070]" />
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* ROW 2: TRACEABILITY JOURNEY TIMELINE FLOW  */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs w-full space-y-6">
        <h2 className="text-base font-extrabold text-[#2D2620]">Traceability Journey</h2>

        {/* 5 Horizontal Steps Flow */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2 px-2 py-4">
          
          {/* Horizontal Connecting Dotted Line Background */}
          <div className="hidden md:block absolute top-[46px] left-[8%] right-[8%] h-0.5 border-t-2 border-dashed border-[#D4E4CE] z-0" />

          {journeySteps.map((step, idx) => {
            const IconComponent = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center text-center space-y-2 max-w-[160px]">
                {/* Step Circle Badge */}
                <div className="w-14 h-14 rounded-full bg-[#EBF3E8] border border-[#D4E4CE] flex items-center justify-center text-[#556B2F] shadow-2xs group hover:scale-110 transition-transform">
                  <IconComponent className="w-6 h-6 text-[#556B2F]" />
                </div>

                {/* Step Content */}
                <div>
                  <h3 className="font-extrabold text-xs text-[#2D2620]">{step.title}</h3>
                  <span className="text-[10px] text-[#666057] block font-semibold mt-0.5">{step.time}</span>
                  <span className="text-[10px] text-[#8C8275] block mt-0.5">{step.location}</span>
                </div>

                {/* Completed Badge */}
                <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30 inline-block">
                  {step.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* ROW 3: BATCH DETAILS & JOURNEY EVENTS      */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* Left Card: Product / Batch Details */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-[#2D2620]">Product / Batch Details</h2>

          <div className="divide-y divide-[#E6E1D5]/60 text-xs">
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Batch ID</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.batchId}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Product</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.product}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Quantity</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.quantity}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Farmer / Supplier</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.supplier}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Farm Location</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.farmLocation}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Harvest Date</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.harvestDate}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Packaging Date</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.packagingDate}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Expiry Date</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.expiryDate}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Current Location</span>
              <span className="font-extrabold text-[#2D2620]">{activeBatch.currentLocation}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Journey Events Vertical Timeline */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-[#2D2620]">Journey Events</h2>

          <div className="relative pl-6 space-y-6 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:border-l-2 before:border-dashed before:border-[#88A070]/60">
            {journeyEvents.map((ev, idx) => (
              <div key={idx} className="relative group">
                {/* Green Timeline Dot */}
                <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#556B2F] ring-4 ring-white" />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#556B2F]">{ev.title}</span>
                      <span className="text-[10px] font-semibold text-[#8C8275]">{ev.time}</span>
                    </div>
                    <p className="text-[#2D2620] font-medium mt-1">{ev.desc}</p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#666057] text-right flex-shrink-0 ml-2">
                    <MapPin className="w-3.5 h-3.5 text-[#8C8275]" />
                    <span>{ev.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* ROW 4: DOCUMENTS & CERTIFICATIONS          */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs w-full space-y-4">
        <h2 className="text-base font-extrabold text-[#2D2620]">Documents & Certifications</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => setActiveDocModal(doc)}
              className={`${doc.bg} p-4 rounded-2xl border ${doc.border} shadow-2xs flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${doc.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-[#2D2620]">{doc.title}</h3>
                  <span className="text-[11px] font-bold text-[#666057] block mt-0.5">View / Download</span>
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-[#666057] -rotate-90 group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* SIMULATED QR SCANNER MODAL                 */}
      {/* ========================================== */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 text-center animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D5]">
              <h3 className="font-extrabold text-base text-[#2D2620]">Live QR Code Scanner</h3>
              <button onClick={() => setIsScannerOpen(false)} className="text-[#666057]"><X className="w-5 h-5" /></button>
            </div>

            <div className="relative w-48 h-48 mx-auto rounded-2xl bg-[#1E293B] border-2 border-[#556B2F] flex items-center justify-center overflow-hidden">
              <Camera className="w-12 h-12 text-white/40 animate-pulse" />
              <div className="absolute inset-x-0 top-0 h-1 bg-[#556B2F] animate-bounce" />
            </div>

            <p className="text-xs text-[#666057] font-medium">Position product QR code inside frame to scan automatically</p>

            <button 
              onClick={() => {
                setSearchQuery('BATCH-VEG-100525');
                setIsScannerOpen(false);
                alert('QR Code Scanned Successfully! Batch BATCH-VEG-100525 loaded.');
              }}
              className="w-full py-2.5 rounded-xl bg-[#354424] text-white text-xs font-extrabold hover:bg-[#26321A]"
            >
              Simulate Instant QR Scan
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DOCUMENT PREVIEW & DOWNLOAD MODAL          */}
      {/* ========================================== */}
      {activeDocModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#354424]" />
                <h3 className="text-lg font-extrabold text-[#2D2620]">{activeDocModal.title}</h3>
              </div>
              <button onClick={() => setActiveDocModal(null)} className="text-[#666057]"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-2 text-xs">
              <p><span className="text-[#666057] font-semibold">Document:</span> <span className="font-bold text-[#2D2620]">{activeDocModal.fileType}</span></p>
              <p><span className="text-[#666057] font-semibold">Associated Batch:</span> <span className="font-extrabold text-[#2D2620]">{activeBatch.batchId}</span></p>
              <p><span className="text-[#666057] font-semibold">Issuer Authority:</span> <span className="font-bold text-[#556B2F]">AgriChain Verified Quality Board</span></p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  alert(`Downloading ${activeDocModal.title} PDF for ${activeBatch.batchId}...`);
                  setActiveDocModal(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-[#354424] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-[#26321A]"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>

              <button 
                onClick={() => {
                  alert(`Viewing digital cryptographic certificate for ${activeBatch.batchId}`);
                  setActiveDocModal(null);
                }}
                className="px-4 py-3 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-[#E6E1D5]"
              >
                <Eye className="w-4 h-4 text-[#556B2F]" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
