import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Smartphone } from 'lucide-react';
import { getBatchQRCodeImageUrl, getBatchConsumerPassportUrl } from '../utils/qrHelper';

export const LargeQRModal = ({ isOpen, onClose, batchId, cropName, origin }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !batchId) return null;

  const targetUrl = getBatchConsumerPassportUrl(batchId);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 border border-[#E6E1D5] shadow-2xl flex flex-col items-center text-center space-y-4 animate-scale-in">
        <div className="w-full flex items-center justify-between pb-3 border-b border-[#E6E1D5]">
          <div className="flex items-center gap-2 text-[#354424]">
            <Smartphone className="w-5 h-5 text-[#556B2F]" />
            <h3 className="text-base font-extrabold text-[#2D2620]">Large Mobile QR Passport</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full flex flex-col items-center">
          <span className="text-xs font-bold text-[#556B2F] uppercase tracking-wider">
            {cropName || 'Farm Fresh Produce'}
          </span>
          <span className="text-xs font-mono font-semibold text-[#786E65]">
            Batch ID: #{batchId}
          </span>
          {origin && (
            <span className="text-[11px] text-[#8C827A] truncate max-w-[280px]">
              Origin: {origin}
            </span>
          )}
        </div>

        {/* Large High-Contrast Scannable QR Code */}
        <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white p-3 rounded-3xl border-2 border-[#556B2F] shadow-lg flex flex-col items-center justify-center">
          <img
            src={getBatchQRCodeImageUrl(batchId, 320)}
            alt={`QR #${batchId}`}
            className="w-full h-full object-contain"
          />
        </div>

        <p className="text-xs font-bold text-[#354424] max-w-xs leading-relaxed">
          Point your mobile phone camera at this QR code to load the live digital journey.
        </p>

        {/* Action Link & Direct Copy */}
        <div className="w-full pt-2 border-t border-[#E6E1D5] flex items-center justify-between gap-2">
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-[#FAF7F0] hover:bg-[#F2ECE1] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#354424] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open Link in Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="py-2 px-3 bg-[#3D4E2A] hover:bg-[#2A371B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy URL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
