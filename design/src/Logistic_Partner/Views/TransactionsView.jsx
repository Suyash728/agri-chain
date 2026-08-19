import React from 'react';
import { FileText, Download } from 'lucide-react';

export const TransactionsView = () => {
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
