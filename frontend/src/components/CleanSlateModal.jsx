import React, { useState } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, RefreshCw, X, ShieldAlert } from 'lucide-react';

export const CleanSlateModal = ({ isOpen, onClose, onResetComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/admin/system-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to execute system reset');
      }
      const data = await res.json();
      setResult(data);
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('agrichain_read_notifs_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('agrichain-data-reset', { detail: data }));
      window.dispatchEvent(new CustomEvent('agrichain-data-updated', { detail: data }));
      if (onResetComplete) {
        onResetComplete(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-[#E6E1D5] max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#8C827A] hover:text-[#2D2620] rounded-xl hover:bg-[#FAF7F0] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {result ? (
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#2D2620] tracking-tight">
              System Reset to Clean Slate!
            </h3>
            <p className="text-xs text-[#666057] mt-1.5 leading-relaxed">
              All produce batches, telemetry readings, and custody trails have been purged. Framework is now on a fresh 0-inventory slate ready for clean presentation.
            </p>
            <div className="w-full bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-3 my-4 text-left text-xs space-y-1 font-mono">
              <div className="flex justify-between text-[#666057]">
                <span>Batches Cleared:</span>
                <span className="font-bold text-[#2D2620]">{result.report?.cleared_records?.batches || 0}</span>
              </div>
              <div className="flex justify-between text-[#666057]">
                <span>Telemetry Readings:</span>
                <span className="font-bold text-[#2D2620]">{result.report?.cleared_records?.readings || 0}</span>
              </div>
              <div className="flex justify-between text-[#666057]">
                <span>Quarantine Logs:</span>
                <span className="font-bold text-[#2D2620]">{result.report?.cleared_records?.quarantine || 0}</span>
              </div>
              <div className="flex justify-between text-[#666057]">
                <span>Custody Transfers:</span>
                <span className="font-bold text-[#2D2620]">{result.report?.cleared_records?.custody_events || 0}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-[#E6E1D5]">
                <span>Accounts & Policies:</span>
                <span>PRESERVED</span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-[#354424] hover:bg-[#2D3B1E] text-white py-2.5 rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all"
            >
              Continue to Presentation
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#2D2620] tracking-tight">
                  Reset System to Clean Slate?
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Presentation Mode Prep
                </span>
              </div>
            </div>

            <p className="text-xs text-[#666057] leading-relaxed mb-4">
              This action resets all data across all supply chain roles (Farmer, Logistics, Dark Store, Consumer) so you can demonstrate the framework from scratch.
            </p>

            <div className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-3.5 mb-5 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-rose-800">
                <Trash2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span><strong>Purged:</strong> All batches (0 kg inventory), custody events, IoT telemetry, quarantine logs, spoilage claims, and reviews.</span>
              </div>
              <div className="flex items-start gap-2 text-emerald-800 border-t border-[#E6E1D5] pt-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Preserved:</strong> Participant accounts, wallet addresses, on-chain role permissions, and crop policy boundaries.</span>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#666057] hover:bg-[#FAF7F0] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{loading ? 'Wiping Data...' : 'Confirm & Wipe to Clean Slate'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
