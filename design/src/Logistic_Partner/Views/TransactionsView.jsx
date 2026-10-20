import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertTriangle } from 'lucide-react';

export const TransactionsView = () => {
  const [spoilageData, setSpoilageData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/incidents/spoilage')
      .then((res) => res.json())
      .then((data) => setSpoilageData(data))
      .catch((err) => console.log('Logistics transactions spoilage fetch note:', err));
  }, []);

  const txs = [
    { desc: 'Payment to Supplier (ORD1256)', amount: '₹ 21,000', date: '12 May, 2025', status: 'Completed' },
    { desc: 'Freight Charges (SHP5678)', amount: '₹ 8,500', date: '12 May, 2025', status: 'Completed' },
    { desc: 'Storage Charges (Nashik Warehouse)', amount: '₹ 5,200', date: '11 May, 2025', status: 'Completed' },
    { desc: 'Advance from Buyer (Green Valley Traders)', amount: '₹ 50,000', date: '10 May, 2025', status: 'Completed' },
    { desc: 'Payment to Supplier (ORD1255)', amount: '₹ 16,000', date: '10 May, 2025', status: 'Completed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-2xl border border-[#E6E1D5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2620]">Logistics Invoices & Transactions 📑</h1>
          <p className="text-xs sm:text-sm text-[#666057]">Total Monthly Volume: ₹ 2,45,680 | Freight & Storage Ledger</p>
        </div>
        <button onClick={() => alert('Financial ledger statement downloaded!')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#26321A] transition-colors cursor-pointer">
          <Download className="w-4 h-4" />
          <span>Export Ledger</span>
        </button>
      </div>

      {/* Transit Thermal Breach & Damage Liability Ledger */}
      {spoilageData && spoilageData.total_incidents > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                🚚
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-950">Cold-Chain Breach & Transporter Damage Penalties</h3>
                <p className="text-[11px] text-amber-800">Assigned freight liability deductions due to transit cooling failures</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-600 text-white rounded-xl text-xs font-extrabold">
              Total Transit Liability: ₹{spoilageData.total_loss_money_inr.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2">
            {spoilageData.incidents.map((inc) => (
              <div key={inc.incident_id} className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#2D2620]">Batch #{inc.batch_id} ({inc.crop_name})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">{inc.failure_type}</span>
                  </div>
                  <p className="text-[11px] text-[#666057] mt-0.5">{inc.details}</p>
                </div>
                <div className="text-right sm:flex-shrink-0">
                  <span className="text-xs font-black text-rose-600 block">-₹{inc.total_loss_inr.toLocaleString('en-IN')} Penalty</span>
                  <span className="text-[10px] text-[#8C8275] block font-bold">{inc.loss_goods_kg} kg spoiled ({inc.status})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E6E1D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF7F0] border-b border-[#E6E1D5]">
              <tr className="text-[#666057] font-semibold">
                <th className="p-4">Transaction Description</th>
                <th className="p-4 text-center">Date</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D5]/50">
              {txs.map((t, i) => (
                <tr key={i} className="hover:bg-[#FAF7F0]/50 transition-colors">
                  <td className="p-4 font-bold text-[#2D2620]">{t.desc}</td>
                  <td className="p-4 text-center text-[#8C8275]">{t.date}</td>
                  <td className="p-4 text-right font-extrabold text-[#2D2620]">{t.amount}</td>
                  <td className="p-4 text-right"><span className="px-2.5 py-1 rounded text-xs font-bold bg-[#556B2F]/15 text-[#556B2F]">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
