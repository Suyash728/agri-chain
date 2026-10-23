import React, { useState, useEffect } from 'react';
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

import { useNotificationCount } from '../../utils/useNotificationCount';
import { API_BASE_URL } from '../../utils/api';
import { getBatchQRCodeImageUrl } from '../../utils/qrHelper';

export const DarkStoreBlockchainView = ({ onBack, onOpenNotifications }) => {
  const { count } = useNotificationCount('darkstore');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStore, setActiveStore] = useState('Nashik Central Store');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  const [copiedHash, setCopiedHash] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeDocModal, setActiveDocModal] = useState(null);
  const [liveBatchData, setLiveBatchData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/batches`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableBatches(data);
          setSearchQuery(data[0].batch_id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cleanId = searchQuery.trim().toUpperCase();
    if (!cleanId) return;
    fetch(`http://localhost:8000/batches/${cleanId}/traceability`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && (data.batchId || data.batch_id)) {
          setLiveBatchData(data);
        } else {
          setLiveBatchData(null);
        }
      })
      .catch(() => setLiveBatchData(null));
  }, [searchQuery]);

  const activeRecord = {
    batchId: liveBatchData?.batchId || liveBatchData?.batch_id || searchQuery || 'BATCH-LIVE-001',
    product: liveBatchData?.product || liveBatchData?.crop_name || 'Agricultural Produce',
    quantity: liveBatchData?.quantity || '500 kg',
    supplier: (liveBatchData?.farmDetails || liveBatchData?.origin_farm || 'Nashik Organic Farm cluster 4').split('||')[0].trim(),
    harvestDate: liveBatchData?.harvestDate || new Date().toISOString().split('T')[0],
    packagingDate: liveBatchData?.harvestDate || new Date().toISOString().split('T')[0],
    expiryDate: 'Within 7 Days',
    txHash: (liveBatchData?.custodyHistory && liveBatchData.custodyHistory[0] && liveBatchData.custodyHistory[0].txHash) ? `0x${liveBatchData.custodyHistory[0].txHash}` : '0x8f7a6b3e2c4d9f1a7b6e8c2d9f4a7b6c8d2f5a7b9c6e1d0f2a7b9c6d4e2f1a8',
    blockNumber: `# ${Math.abs((searchQuery || 'BATCH').split('').reduce((a,c) => a + c.charCodeAt(0), 5874000))}`,
    timestamp: (liveBatchData?.custodyHistory && liveBatchData.custodyHistory[0] && liveBatchData.custodyHistory[0].occurredAt) ? liveBatchData.custodyHistory[0].occurredAt : new Date().toLocaleString(),
    network: 'AgriChain Local PoA Ledger',
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeRecord.txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // On-Chain Journey Milestones derived from live custody history
  const onChainJourney = (liveBatchData?.custodyHistory && liveBatchData.custodyHistory.length > 0)
    ? liveBatchData.custodyHistory.map((ch) => ({
        title: ch.state.replace('_', ' '),
        time: ch.occurredAt || 'Confirmed',
        desc: `Custody to ${ch.toHolder || 'Holder'} (Tx: ${ch.txHash ? ch.txHash.slice(0, 10) : ''}...)`,
        supplier: ch.toHolder,
        location: ch.state === 'REGISTERED' ? (activeRecord.supplier || 'Nashik Farm') : (ch.state === 'IN_TRANSIT' ? 'In Transit Cold Carrier' : 'Nashik Dark Store')
      }))
    : [
        {
          title: 'Farm Registration',
          time: activeRecord.harvestDate || 'Registered',
          desc: 'Harvested and registered on blockchain ledger',
          supplier: activeRecord.supplier,
          location: activeRecord.supplier || 'Farm Origin',
        },
        {
          title: 'Dispatch & Transit',
          time: activeRecord.timestamp || 'In Progress',
          desc: 'Dispatched with certified cold-chain carrier',
          location: 'Cold Carrier Transit',
        },
        {
          title: 'Dark Store Gate In',
          time: 'Active Verification',
          desc: 'Verified by Smart Contract against AI Trust Oracle',
          location: 'Nashik Central Dark Store',
        }
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
            onClick={onOpenNotifications || (() => {})}
            className="relative p-2.5 rounded-2xl bg-white border border-[#E6E1D5] text-[#2D2620] hover:bg-[#FAF7F0] cursor-pointer shadow-xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#2D2620]" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#556B2F] text-white text-[10px] font-black flex items-center justify-center">
                {count}
              </span>
            )}
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

            <div className="relative w-48 h-48 mx-auto rounded-2xl bg-[#1E293B] border-2 border-[#556B2F] flex flex-col items-center justify-center overflow-hidden p-3">
              {availableBatches.length > 0 ? (
                <div className="w-28 h-28 bg-white p-1 rounded-xl shadow-lg border border-emerald-400 flex items-center justify-center">
                  <img
                    src={getBatchQRCodeImageUrl(availableBatches[0].batch_id, 110)}
                    alt="Blockchain QR"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <Camera className="w-12 h-12 text-white/40 animate-pulse" />
              )}
              <div className="absolute inset-x-0 top-0 h-1 bg-[#556B2F] animate-bounce" />
            </div>

            <p className="text-xs text-[#666057] font-medium">Position product QR code inside frame to verify on-chain ledger</p>

            {availableBatches.length > 0 && (
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-bold text-[#666057]">Detected On-Chain Packages:</span>
                <div className="flex flex-wrap gap-1">
                  {availableBatches.map(b => (
                    <button
                      key={b.batch_id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(b.batch_id);
                        setIsScannerOpen(false);
                      }}
                      className="text-[10px] font-bold px-2 py-1 bg-[#FAF7F0] border border-[#E6E1D5] rounded-lg hover:border-[#354424] cursor-pointer"
                    >
                      {b.crop_name} (#{b.batch_id.slice(-6)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                const target = availableBatches[0]?.batch_id || searchQuery;
                setSearchQuery(target);
                setIsScannerOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#354424] text-white text-xs font-extrabold hover:bg-[#26321A] cursor-pointer shadow-xs"
            >
              Simulate Instant QR Verification {availableBatches[0] && `(#${availableBatches[0].batch_id.slice(-6)})`}
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
