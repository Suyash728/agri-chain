import React from 'react';
import { ArrowLeft, Sparkles, TrendingUp, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export const AnalyticsView = ({ onBack }) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E1D5] shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">
              AI Freshness & Waste Prevention Analytics
            </h1>
            <p className="text-xs text-[#666057]">Demand forecasting, shelf-life optimization & zero-waste micro-fulfillment metrics</p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30 text-xs font-extrabold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#556B2F]" />
          AI Waste Model V4 Active
        </span>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs space-y-3">
          <span className="text-xs font-extrabold text-[#666057] uppercase tracking-wider block">Store Freshness Score</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#2D2620]">97.8 %</div>
          <p className="text-xs text-[#556B2F] font-bold">Top 1% across Nashik Micro-Hub Network</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs space-y-3">
          <span className="text-xs font-extrabold text-[#666057] uppercase tracking-wider block">Monthly Spoilage Rate</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#556B2F]">0.24 %</div>
          <p className="text-xs text-[#666057] font-semibold">Reduced from 4.8% baseline via FEFO AI</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs space-y-3">
          <span className="text-xs font-extrabold text-[#666057] uppercase tracking-wider block">Order Pick SLA Compliance</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#2563EB]">99.2 %</div>
          <p className="text-xs text-[#666057] font-semibold">Average pick time: 4.8 minutes per order</p>
        </div>
      </div>

      {/* Predictive Demand & Reorder AI Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E1D5] shadow-xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#2D2620]">AI Demand Forecast & Auto-Reorder Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6E1D5] text-[#666057] font-bold uppercase tracking-wider">
                <th className="pb-3">Crop Category</th>
                <th className="pb-3">Current Stock</th>
                <th className="pb-3">3-Day Forecast Demand</th>
                <th className="pb-3">Recommended Auto-Procurement</th>
                <th className="pb-3">Freshness Alert Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D5]/60 text-[#2D2620] font-semibold">
              <tr>
                <td className="py-3 font-bold">Tomatoes (Grade A)</td>
                <td>420 kg</td>
                <td>1,100 kg</td>
                <td><span className="text-[#354424] font-extrabold">+680 kg from Nashik Farm</span></td>
                <td><span className="text-[#556B2F] font-bold">✓ Optimal (8 Days Remaining)</span></td>
              </tr>
              <tr>
                <td className="py-3 font-bold">Green Peas & Spinach</td>
                <td>180 kg</td>
                <td>450 kg</td>
                <td><span className="text-[#354424] font-extrabold">+270 kg from Pune Hub</span></td>
                <td><span className="text-[#556B2F] font-bold">✓ Optimal (5 Days Remaining)</span></td>
              </tr>
              <tr>
                <td className="py-3 font-bold">Red Onions & Potatoes</td>
                <td>920 kg</td>
                <td>800 kg</td>
                <td><span className="text-[#666057]">No Reorder Needed</span></td>
                <td><span className="text-[#556B2F] font-bold">✓ Optimal (20 Days Remaining)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
