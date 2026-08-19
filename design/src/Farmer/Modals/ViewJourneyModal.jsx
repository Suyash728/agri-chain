import React from 'react';
import { X, ShieldCheck, QrCode, CheckCircle2, Truck, Factory, Sprout, Store } from 'lucide-react';
import { traceabilityBatch } from '../../data/mockData';

export const ViewJourneyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#3D4E2A]" />
            <h3 className="text-base font-extrabold text-[#3B3028]">Verified Supply Chain Journey</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* QR Code and Product Header */}
          <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E6E1D5] flex items-center justify-between">
            <div>
              <span className="badge-confirmed text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1">
                AI Verified & Blockchain Signed
              </span>
              <h4 className="text-lg font-extrabold text-[#3B3028]">
                {traceabilityBatch.product} (Sharbati Organic)
              </h4>
              <p className="text-xs text-[#786E65] font-mono mt-0.5">
                Batch ID: {traceabilityBatch.batchId}
              </p>
            </div>

            <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-[#E6E1D5] flex flex-col items-center justify-center shadow-xs">
              <QrCode className="w-10 h-10 text-[#3D4E2A]" />
              <span className="text-[8px] font-bold text-[#7A8B52]">SCAN QR</span>
            </div>
          </div>

          {/* Timeline steps */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#786E65]">
              Step-by-Step Blockchain Audit Log
            </h4>

            {traceabilityBatch.steps.map((step, idx) => {
              const isCompleted = step.status === 'Completed';
              const isInTransit = step.status === 'In Transit';

              return (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold mt-0.5 ${
                    isCompleted ? 'bg-[#E3EBD3] text-[#3D5220] border-[#7A8B52]' :
                    isInTransit ? 'bg-[#FCEAD8] text-[#A3521E] border-[#B85C38]' :
                    'bg-white text-[#786E65] border-[#E6E1D5]'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h5 className="text-sm font-bold text-[#3B3028]">{step.name}</h5>
                      <span className="text-[11px] font-semibold text-[#786E65]">{step.date}</span>
                    </div>
                    <p className="text-xs text-[#786E65] mt-0.5">{step.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
