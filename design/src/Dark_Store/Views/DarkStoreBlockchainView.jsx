import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Search, 
  QrCode, 
  Calendar, 
  ChevronDown, 
  Bell, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink, 
  X, 
  Camera,
  MapPin,
  Lock,
  Layers,
  Clock
} from 'lucide-react';

export const DarkStoreBlockchainView = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('BATCH-VEG-100525');
  const [activeStore, setActiveStore] = useState('Nashik Central Store');
  const [selectedDate, setSelectedDate] = useState('12 May, 2025');
  const [copiedHash, setCopiedHash] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeDocModal, setActiveDocModal] = useState(null);

  // Blockchain Ledger Record Data Map
  const ledgerDataMap = {
    'BATCH-VEG-100525': {
      batchId: 'BATCH-VEG-100525',
      product: 'Tomatoes (Grade A)',
      quantity: '230 kg',
      supplier: 'Fresh Veg Traders',
      harvestDate: '09 May, 2025',
      packagingDate: '10 May, 2025',
      expiryDate: '17 May, 2025',
      txHash: '0x8f7a6b3e2c4d9f1a7b6e8c2d9f4a7b6c8d2f5a7b9c6e1d0f2a7b9c6d4e2f1a8',
      blockNumber: '# 5874521',
      timestamp: '10 May, 2025, 06:45 PM',
      network: 'AgriChain Network',
    },
    'BATCH-FRU-200840': {
      batchId: 'BATCH-FRU-200840',
      product: 'Alphonso Mangoes',
      quantity: '180 kg',
      supplier: 'Green Valley Farms',
      harvestDate: '08 May, 2025',
      packagingDate: '09 May, 2025',
      expiryDate: '22 May, 2025',
      txHash: '0x4c9e8a7b6c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6',
      blockNumber: '# 5874410',
      timestamp: '09 May, 2025, 04:15 PM',
      network: 'AgriChain Network',
    },
    'BATCH-GRA-300120': {
      batchId: 'BATCH-GRA-300120',
      product: 'Moong Dal / Green Gram',
      quantity: '310 kg',
      supplier: 'Daily Needs Organic Farm',
      harvestDate: '01 May, 2025',
      packagingDate: '03 May, 2025',
      expiryDate: '30 Jun, 2025',
      txHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      blockNumber: '# 5873990',
      timestamp: '03 May, 2025, 11:30 AM',
      network: 'AgriChain Network',
    },
  };

  const activeRecord = ledgerDataMap[searchQuery.trim().toUpperCase()] || ledgerDataMap['BATCH-VEG-100525'];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeRecord.txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // 5 On-Chain Journey Milestones matching reference screenshot
  const onChainJourney = [
    {
      title: 'Farm',
      time: '10 May, 07:00 AM',
      desc: 'Harvested and packed at farm',
      supplier: activeRecord.supplier,
      location: 'Nashik, Maharashtra',
    },
    {
      title: 'Collection',
      time: '10 May, 09:30 AM',
      desc: 'Collected from farm and received',
      location: 'Nashik Collection Hub',
    },
    {
      title: 'Processing',
      time: '10 May, 11:45 AM',
      desc: 'Quality checked, graded and packed',
      location: 'Nashik Processing Unit',
    },
    {
      title: 'In Transit',
      time: '10 May, 03:20 PM',
      desc: 'Out for delivery from processing unit',
      location: 'En Route to Store',
    },
    {
      title: 'Store Received',
      time: '11 May, 08:15 AM',
      desc: 'Delivery received at Nashik Central Store',
      location: 'Nashik Central Store',
    },
  ];

  // 4 On-Chain Record Documents
  const recordDocuments = [
    {
      id: 'quality-cert',
      title: 'Quality Certificate',
      subtext: 'View on Blockchain',
      bg: 'bg-[#EFF4E9]',
      border: 'border-[#D9E6D3]',
      iconBg: 'bg-[#556B2F]/15 text-[#556B2F]',
      blockHash: '0x7a2...f9e1',
    },
    {
      id: 'lab-report',
      title: 'Lab Test Report',
      subtext: 'View on Blockchain',
      bg: 'bg-[#FFF4EC]',
      border: 'border-[#FDE3D2]',
      iconBg: 'bg-[#B85C38]/15 text-[#B85C38]',
      blockHash: '0x8b3...e4c2',
    },
    {
      id: 'transport-receipt',
      title: 'Transport Receipt',
      subtext: 'View on Blockchain',
      bg: 'bg-[#EEF4FB]',
      border: 'border-[#DCE9FE]',
      iconBg: 'bg-[#2563EB]/15 text-[#2563EB]',
      subtextColor: 'text-[#2563EB]',
      blockHash: '0x9c4...d5b3',
    },
    {
      id: 'packing-slip',
      title: 'Packing Slip',
      subtext: 'View on Blockchain',
      bg: 'bg-[#F5EEF9]',
      border: 'border-[#E9D5FF]',
      iconBg: 'bg-[#9333EA]/15 text-[#9333EA]',
      subtextColor: 'text-[#9333EA]',
      blockHash: '0x0d5...c6a4',
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
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2620]">
              Blockchain Verification
            </h1>
            <p className="text-xs text-[#666057] mt-0.5 font-medium">
              Verify the authenticity and immutability of product records on the blockchain.
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Bell Notification Button */}
          <button 
            onClick={() => alert('3 new blockchain ledger smart contract confirmations active!')}
            className="relative p-2.5 rounded-2xl bg-white border border-[#E6E1D5] text-[#2D2620] hover:bg-[#FAF7F0] cursor-pointer shadow-xs"
          >
            <Bell className="w-4 h-4 text-[#2D2620]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#556B2F] text-white text-[10px] font-black flex items-center justify-center">
              3
            </span>
          </button>

          {/* Date Selector Pill */}
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
        
        {/* Left Card: Search by Batch / Product / Transaction ID */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-base font-extrabold text-[#2D2620]">Search by Batch / Product / Transaction ID</h2>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Batch ID, Product Name or Transaction ID"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] text-[#2D2620] placeholder-[#8C8275] focus:outline-none focus:border-[#354424] transition-colors"
              />
              <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={() => {
                if (!ledgerDataMap[searchQuery.trim().toUpperCase()]) {
                  alert(`Transaction ID / Batch "${searchQuery}" not found. Try BATCH-VEG-100525, BATCH-FRU-200840, or BATCH-GRA-300120.`);
                }
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#354424] text-white text-xs font-extrabold flex items-center gap-2 hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Verify Now</span>
            </button>
          </div>
        </div>

        {/* Right Card: Or Scan QR Code */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs flex items-center justify-between">
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-extrabold text-[#2D2620]">Or Scan QR Code</h2>
              <p className="text-xs text-[#666057] mt-0.5 font-medium">Scan the QR code on product / package</p>
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
      {/* ROW 2: VERIFICATION RESULT CARD            */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs w-full space-y-4">
        <h2 className="text-base font-extrabold text-[#2D2620]">Verification Result</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Left Details Block */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Record Verified Banner */}
            <div className="flex items-center gap-2 text-[#15803D]">
              <div className="w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              </div>
              <span className="text-base font-extrabold tracking-tight">Record Verified on Blockchain</span>
            </div>

            {/* Transaction Hash */}
            <div>
              <span className="text-[11px] font-bold text-[#666057] block mb-1">Transaction Hash</span>
              <div className="flex items-center gap-2 bg-[#FAF7F0] p-2.5 rounded-2xl border border-[#E6E1D5]">
                <code className="text-xs font-mono font-bold text-[#2D2620] break-all select-all flex-1">
                  {activeRecord.txHash}
                </code>
                <button 
                  onClick={copyToClipboard}
                  title="Copy Hash"
                  className="p-1.5 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer flex-shrink-0"
                >
                  {copiedHash ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4 text-[#666057]" />}
                </button>
              </div>
            </div>

            {/* Block Info Badges */}
            <div className="grid grid-cols-3 gap-4 pt-1 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#666057] block">Block Number</span>
                <span className="font-extrabold text-[#2D2620]">{activeRecord.blockNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#666057] block">Timestamp</span>
                <span className="font-extrabold text-[#2D2620]">{activeRecord.timestamp}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#666057] block">Network</span>
                <span className="font-extrabold text-[#2D2620]">{activeRecord.network}</span>
              </div>
            </div>

          </div>

          {/* Right Green Authentic Box matching reference screenshot */}
          <div className="lg:col-span-4 bg-[#F3F7F0] border border-[#D9E6D3] rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[150px]">
            <div className="w-14 h-14 rounded-full bg-white border border-[#D9E6D3] flex items-center justify-center text-[#556B2F] shadow-2xs">
              <ShieldCheck className="w-7 h-7 text-[#556B2F]" />
            </div>
            <p className="text-xs font-extrabold text-[#2D2620] leading-tight max-w-[160px]">
              Data is authentic and tamper-proof
            </p>
          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* ROW 3: BATCH DETAILS & ON-CHAIN JOURNEY    */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        
        {/* Left Card: Product / Batch Details */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-[#2D2620]">Product / Batch Details</h2>

          <div className="divide-y divide-[#E6E1D5]/60 text-xs">
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Batch ID</span>
              <span className="font-extrabold text-[#2D2620]">{activeRecord.batchId}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Product</span>
              <span className="font-extrabold text-[#2D2620]">{activeRecord.product}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Quantity</span>
              <span className="font-extrabold text-[#2D2620]">{activeRecord.quantity}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Farmer / Supplier</span>
              <span className="font-extrabold text-[#2D2620]">{activeRecord.supplier}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Harvest Date</span>
              <span className="font-extrabold text-[#2D2620]">{activeRecord.harvestDate}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Packaging Date</span>
              <span className="font-extrabold text-[#2D2620]">{activeRecord.packagingDate}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#666057] font-semibold">Expiry Date</span>
              <span className="font-extrabold text-[#2D2620]">{activeRecord.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* Right Card: On-Chain Journey Vertical Timeline */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-[#2D2620]">On-Chain Journey</h2>

          <div className="relative pl-6 space-y-5 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:border-l-2 before:border-dashed before:border-[#88A070]/60">
            {onChainJourney.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Green Timeline Dot */}
                <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#556B2F] ring-4 ring-white" />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#556B2F]">{item.title}</span>
                      <span className="text-[10px] font-semibold text-[#8C8275]">{item.time}</span>
                    </div>
                    <p className="text-[#2D2620] font-medium mt-1">{item.desc}</p>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    {item.supplier && (
                      <span className="font-bold text-[#2563EB] block text-[11px]">{item.supplier}</span>
                    )}
                    <span className="text-[11px] font-semibold text-[#666057] flex items-center justify-end gap-1">
                      <MapPin className="w-3 h-3 text-[#8C8275]" />
                      <span>{item.location}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* ROW 4: RECORD DOCUMENTS (ON-CHAIN)         */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6E1D5] shadow-xs w-full space-y-4">
        <h2 className="text-base font-extrabold text-[#2D2620]">Record Documents (On-Chain)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recordDocuments.map((doc) => (
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
                  <span className={`text-[11px] font-bold block mt-0.5 ${doc.subtextColor || 'text-[#666057]'}`}>
                    {doc.subtext}
                  </span>
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-[#666057] -rotate-90 group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* SIMULATED QR SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 text-center animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D5]">
              <h3 className="font-extrabold text-base text-[#2D2620]">Blockchain QR Scanner</h3>
              <button onClick={() => setIsScannerOpen(false)} className="text-[#666057]"><X className="w-5 h-5" /></button>
            </div>

            <div className="relative w-48 h-48 mx-auto rounded-2xl bg-[#1E293B] border-2 border-[#556B2F] flex items-center justify-center overflow-hidden">
              <Camera className="w-12 h-12 text-white/40 animate-pulse" />
              <div className="absolute inset-x-0 top-0 h-1 bg-[#556B2F] animate-bounce" />
            </div>

            <p className="text-xs text-[#666057] font-medium">Position product QR code inside frame to verify on-chain ledger</p>

            <button 
              onClick={() => {
                setSearchQuery('BATCH-VEG-100525');
                setIsScannerOpen(false);
                alert('QR Code Scanned! On-Chain Verification successful for BATCH-VEG-100525.');
              }}
              className="w-full py-2.5 rounded-xl bg-[#354424] text-white text-xs font-extrabold hover:bg-[#26321A]"
            >
              Simulate Instant QR Verification
            </button>
          </div>
        </div>
      )}

      {/* DOCUMENT BLOCKCHAIN MODAL */}
      {activeDocModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#354424]" />
                <h3 className="text-lg font-extrabold text-[#2D2620]">{activeDocModal.title}</h3>
              </div>
              <button onClick={() => setActiveDocModal(null)} className="text-[#666057]"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] space-y-2 text-xs">
              <p><span className="text-[#666057] font-semibold">On-Chain Record:</span> <span className="font-bold text-[#2D2620]">{activeDocModal.title}</span></p>
              <p><span className="text-[#666057] font-semibold">Batch ID:</span> <span className="font-extrabold text-[#2D2620]">{activeRecord.batchId}</span></p>
              <p><span className="text-[#666057] font-semibold">Block Hash:</span> <code className="font-mono font-bold text-[#556B2F]">{activeDocModal.blockHash}</code></p>
              <p><span className="text-[#666057] font-semibold">Status:</span> <span className="font-bold text-[#15803D]">✓ Cryptographically Sealed & Verified</span></p>
            </div>

            <button 
              onClick={() => {
                alert(`Opening Block Explorer for ${activeDocModal.title} (${activeDocModal.blockHash})...`);
                setActiveDocModal(null);
              }}
              className="w-full py-3 rounded-2xl bg-[#354424] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-[#26321A]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View On AgriChain Block Explorer</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
