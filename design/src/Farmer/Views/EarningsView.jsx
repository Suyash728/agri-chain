import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, TrendingUp, DollarSign, AlertTriangle, ShieldCheck } from 'lucide-react';
import { earningsSummary } from '../../data/mockData';

export const EarningsView = ({ onBack, onOpenReport }) => {
  const [spoilageData, setSpoilageData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/incidents/spoilage')
      .then((res) => res.json())
      .then((data) => setSpoilageData(data))
      .catch((err) => console.log('Farmer earnings spoilage fetch note:', err));
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E1D5] shadow-xs w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors border border-[#E6E1D5]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#3B3028]">
            Earnings Summary
          </h1>
        </div>
      </div>

      {/* Main Earnings Dark Olive Banner */}
      <div className="bg-[#3D4E2A] text-white rounded-2xl p-5 sm:p-6 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#C2CBAD] uppercase tracking-wider block">
            Total Revenue (This Month)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {earningsSummary.totalThisMonth}
            </span>
            <span className="text-xs font-bold text-[#A5C282] ml-2">
              {earningsSummary.growthPercentage} {earningsSummary.growthPeriod}
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-[#7A8B52]/40"></div>

        <div className="text-right">
          <span className="text-xs font-semibold text-[#C2CBAD] uppercase tracking-wider block">
            Pending Payouts
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
            {earningsSummary.pendingPayouts}
          </span>
        </div>
      </div>

      {/* Supply Chain Spoilage & Deductions Section */}
      {spoilageData && spoilageData.total_incidents > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col gap-3 shadow-2xs w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                ⚠️
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-red-950">Supply Chain Spoilage & Financial Deductions</h3>
                <p className="text-[11px] text-red-700">Produce damaged in transit or storage with pending insurance recovery</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-800">
                Spoiled: {spoilageData.total_loss_goods_kg} kg
              </span>
              <span className="px-3 py-1 bg-red-600 text-white rounded-xl text-xs font-extrabold shadow-2xs">
                Loss Impact: -₹{spoilageData.total_loss_money_inr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            {spoilageData.incidents.map((inc) => (
              <div key={inc.incident_id} className="bg-white p-3.5 rounded-xl border border-red-200 flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#2D2620]">{inc.crop_name} (Batch #{inc.batch_id})</span>
                  <span className="font-black text-red-600">-₹{inc.total_loss_inr.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-[#666057] leading-snug">{inc.details}</p>
                <div className="flex justify-between items-center text-[10px] pt-1 text-[#666057] border-t border-[#E6E1D5]/60">
                  <span>Liable Party: <b className="text-[#2D2620]">{inc.custodian_at_fault}</b></span>
                  <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900">{inc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Breakdown Section with Warm Cream Card Styling */}
      <div 
        style={{ backgroundColor: '#FAF7F0' }}
        className="border border-[#E8E2D5] rounded-2xl p-5 flex flex-col gap-4 shadow-2xs w-full"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#3B3028]">
            Category Revenue Breakdown
          </h2>
          <span className="text-xs font-bold text-[#7A8B52]">
            {earningsSummary.completedTxns} Completed Transactions
          </span>
        </div>

        <div className="flex flex-col gap-3.5 pt-1">
          {earningsSummary.breakdown.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1.5 bg-white p-3.5 rounded-xl border border-[#E6E1D5]">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-[#3B3028]">
                <span>{item.category}</span>
                <span className="font-extrabold text-[#2E3A1F]">{item.amount}</span>
              </div>
              <div className="w-full h-2 bg-[#E6E1D5] rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-[#3D4E2A] rounded-full transition-all duration-500" 
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* View Detailed Report Action Button */}
        <button 
          onClick={onOpenReport}
          className="w-full py-3.5 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2"
        >
          View Full Earnings Report (PDF)
        </button>
      </div>
    </div>
  );
};
