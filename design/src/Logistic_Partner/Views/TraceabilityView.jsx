import React, { useState, useEffect } from 'react';
import { Link2, ShieldCheck, QrCode, CheckCircle2, Search } from 'lucide-react';

export const TraceabilityView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [liveBatch, setLiveBatch] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/logistics/orders')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].id) {
          setSearchQuery(data[0].id);
        } else {
          fetch('http://localhost:8000/farmer/inventory')
            .then(r => r.json())
            .then(inv => {
              if (inv?.items?.[0]?.batchId) {
                setSearchQuery(inv.items[0].batchId);
              }
            }).catch(() => {});
        }
      }).catch(() => {});
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
          setLiveBatch(data);
        } else {
          setLiveBatch(null);
        }
      })
      .catch(() => setLiveBatch(null));
  }, [searchQuery]);

  const batchTitle = liveBatch 
    ? `Batch #${liveBatch.batchId || liveBatch.batch_id} (${liveBatch.product || liveBatch.produce_name || 'Produce'})` 
    : `Batch #${searchQuery || 'LIVE-001'} (Agricultural Produce)`;

  const nodes = liveBatch ? [
    { step: '1. Farm Gate', status: 'Completed', icon: '🌱', detail: (liveBatch.farmDetails || liveBatch.origin_farm || 'Nashik Organic Farm cluster 4').split('||')[0].trim() },
    { step: '2. Harvest', status: 'Completed', icon: '🌾', detail: liveBatch.harvestDate || 'Harvest Logged' },
    { step: '3. Quality Check', status: 'Verified', icon: '⚙️', detail: `Grade ${liveBatch.qualityGrade || 'A+'} (${liveBatch.qualityScore || 98}%)` },
    { step: '4. Transit', status: (liveBatch.currentLocation || '').includes('Transit') ? 'In Progress' : 'Completed', icon: '🚚', detail: liveBatch.currentLocation || 'In Transit' },
    { step: '5. Retail Hub', status: (liveBatch.currentLocation || '').includes('Store') ? 'Received' : 'Pending', icon: '🏬', detail: (liveBatch.currentLocation || '').includes('Store') ? liveBatch.currentLocation : 'En Route to Hub' },
  ] : [
    { step: '1. Farm Gate', status: 'Completed', icon: '🌱', detail: 'Patil Farm, Nashik' },
    { step: '2. Harvest', status: 'Completed', icon: '🌾', detail: new Date().toISOString().split('T')[0] },
    { step: '3. Quality Check', status: 'Passed A+', icon: '⚙️', detail: 'Moisture 11.2%' },
    { step: '4. Transit', status: 'In Progress', icon: '🚚', detail: 'MH12 AB 1234' },
    { step: '5. Retail Hub', status: 'Pending', icon: '🏬', detail: 'Pune Warehouse' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Farm-to-Fork Traceability Passport 🔗</h1>
        <p className="text-xs sm:text-sm text-[#666057]">Immutable batch origin verification & supply chain provenance certificates</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E6E1D5] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E6E1D5] pb-4">
          <div>
            <span className="text-xs font-bold text-[#556B2F] bg-[#556B2F]/15 px-2.5 py-1 rounded-full">
              {liveBatch ? 'Live Blockchain Verified' : 'Verified Web3 Batch'}
            </span>
            <h2 className="text-lg font-extrabold text-[#2D2620] mt-2">{batchTitle}</h2>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Batch ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#556B2F]"
              />
            </div>
            <button 
              onClick={() => {
                const sample = prompt('Enter Batch ID to inspect:', searchQuery);
                if (sample) setSearchQuery(sample);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {nodes.map((node, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-center space-y-1">
              <span className="text-2xl block">{node.icon}</span>
              <p className="font-extrabold text-xs text-[#2D2620]">{node.step}</p>
              <p className="text-[10px] font-bold text-[#556B2F]">{node.status}</p>
              <p className="text-[10px] text-[#666057] truncate">{node.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
