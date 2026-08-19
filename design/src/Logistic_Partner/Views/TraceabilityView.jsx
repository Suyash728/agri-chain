import React from 'react';
import { Link2, ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';

export const TraceabilityView = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Farm-to-Fork Traceability Passport 🔗</h1>
        <p className="text-xs sm:text-sm text-[#666057]">Immutable batch origin verification & supply chain provenance certificates</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E6E1D5] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E6E1D5] pb-4">
          <div>
            <span className="text-xs font-bold text-[#556B2F] bg-[#556B2F]/15 px-2.5 py-1 rounded-full">Verified Web3 Batch</span>
            <h2 className="text-lg font-extrabold text-[#2D2620] mt-2">Batch #WH-120525-01 (Organic Basmati Wheat)</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer">
            <QrCode className="w-4 h-4" />
            <span>Scan QR Certificate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '1. Farm Gate', status: 'Completed', icon: '🌱', detail: 'Patil Farm, Nashik' },
            { step: '2. Harvest', status: 'Completed', icon: '🌾', detail: '05 May, 2025' },
            { step: '3. Quality Check', status: 'Passed A+', icon: '⚙️', detail: 'Moisture 11.2%' },
            { step: '4. Transit', status: 'In Progress', icon: '🚚', detail: 'MH12 AB 1234' },
            { step: '5. Retail Hub', status: 'Pending', icon: '🏬', detail: 'Pune Warehouse' },
          ].map((node, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-center space-y-1">
              <span className="text-2xl block">{node.icon}</span>
              <p className="font-extrabold text-xs text-[#2D2620]">{node.step}</p>
              <p className="text-[10px] font-bold text-[#556B2F]">{node.status}</p>
              <p className="text-[10px] text-[#666057]">{node.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
