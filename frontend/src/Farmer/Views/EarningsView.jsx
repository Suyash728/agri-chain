import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, TrendingUp, DollarSign, AlertTriangle, ShieldCheck, Printer, Download, X, FileText } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

const defaultEarningsSummary = {
  totalRevenue: "₹0",
  totalThisMonth: "₹0",
  growthPercentage: "0%",
  growthPeriod: "vs last month",
  pendingPayouts: "₹0",
  completedTxns: 0,
  breakdown: []
};

export const EarningsView = ({ onBack, onOpenReport }) => {
  const [spoilageData, setSpoilageData] = useState(null);
  const [liveEarnings, setLiveEarnings] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const loadData = () => {
    fetch(`${API_BASE_URL}/incidents/spoilage`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSpoilageData(data))
      .catch(() => {});

    fetch(`${API_BASE_URL}/farmer/earnings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setLiveEarnings(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    window.addEventListener('agrichain-data-reset', loadData);
    window.addEventListener('agrichain-data-updated', loadData);
    return () => {
      window.removeEventListener('agrichain-data-reset', loadData);
      window.removeEventListener('agrichain-data-updated', loadData);
    };
  }, []);

  const summary = liveEarnings || defaultEarningsSummary;

  const handleExportReport = () => {
    if (onOpenReport) {
      onOpenReport();
      return;
    }
    const rows = [
      ['Category', 'Revenue Amount', 'Share Percentage'],
      ...(summary.breakdown || []).map(b => [b.category, `"${b.amount}"`, `"${b.percent}%"`]),
      [],
      ['Total Monthly Revenue', `"${summary.totalThisMonth}"`],
      ['Pending Payouts', `"${summary.pendingPayouts}"`],
      ['Completed Transactions', summary.completedTxns]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Farmer_Earnings_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              {summary.totalThisMonth}
            </span>
            <span className="text-xs font-bold text-[#A5C282] ml-2">
              {summary.growthPercentage} {summary.growthPeriod}
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-[#7A8B52]/40"></div>

        <div className="text-right">
          <span className="text-xs font-semibold text-[#C2CBAD] uppercase tracking-wider block">
            Pending Payouts
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
            {summary.pendingPayouts}
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
            {summary.completedTxns} Completed Transactions
          </span>
        </div>

        <div className="flex flex-col gap-3.5 pt-1">
          {summary.breakdown.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#666057] font-semibold bg-white rounded-xl border border-[#E6E1D5]">
              No category earnings recorded yet.
            </div>
          ) : (
            summary.breakdown.map((item, idx) => (
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
            ))
          )}
        </div>

        {/* View Detailed Report Action Button */}
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="w-full py-3.5 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-200" />
          <span>View Full Earnings Report (PDF)</span>
        </button>
      </div>

      {/* Printable / Downloadable Full Earnings Statement Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#E6E1D5] shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#3D4E2A] text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#2D2620]">Farmer Financial Settlement Statement</h3>
                  <p className="text-xs text-[#666057]">Patil Organic Farm • Dindori Road, Nashik</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#E6E1D5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Statement Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="text-[11px] font-bold text-[#666057] uppercase tracking-wider block">Total Revenue</span>
                <span className="text-xl font-extrabold text-[#2D2620] mt-1 block">{summary.totalRevenue}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]">
                <span className="text-[11px] font-bold text-[#666057] uppercase tracking-wider block">Pending Payouts</span>
                <span className="text-xl font-extrabold text-[#B85C38] mt-1 block">{summary.pendingPayouts}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-[#666057] uppercase tracking-wider block">Settled Transactions</span>
                <span className="text-xl font-extrabold text-[#3D4E2A] mt-1 block">{summary.completedTxns} Batches</span>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="border border-[#E6E1D5] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5]">
                  <tr className="text-[#666057] font-extrabold">
                    <th className="py-2.5 px-3">Crop Category</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D5]/60">
                  {summary.breakdown.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-[#666057]">No category earnings logged yet.</td>
                    </tr>
                  ) : (
                    summary.breakdown.map((b, i) => (
                      <tr key={i} className="hover:bg-[#FAF7F0]/50">
                        <td className="py-2.5 px-3 font-bold text-[#2D2620]">{b.category}</td>
                        <td className="py-2.5 px-3 font-extrabold text-[#2D2620] text-right">{b.amount}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#556B2F] text-right">{b.percent}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions: Print PDF & Download CSV */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6E1D5]">
              <button 
                onClick={handleExportReport}
                className="px-4 py-2.5 rounded-xl border border-[#E6E1D5] text-[#2D2620] text-xs font-bold hover:bg-[#FAF7F0] flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#666057]" />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-[#3D4E2A] text-white text-xs font-extrabold hover:bg-[#2A371B] flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-200" />
                <span>Print Statement (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
