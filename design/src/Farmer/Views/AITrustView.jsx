import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { aiTrustData } from '../../data/mockData';

export const AITrustView = ({ onBack, onOpenDetails }) => {
  return (
    <div className="bg-white border border-[#E6E1D5] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs max-w-xl mx-auto w-full">
      {/* Top Row: Back Arrow + Large AI Trust Score Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors flex-shrink-0 border border-[#E6E1D5]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#3B3028] tracking-tight">
          AI Trust Score
        </h1>
      </div>

      {/* Main Score Row (Positioned below the arrow & title) */}
      <div className="flex items-start justify-between gap-2 mt-1">
        {/* Left: Shield Icon + Large 92 /100 Score */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#2E3A1F] flex items-center justify-center shadow-xs flex-shrink-0 mt-0.5">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8c-2 2-3 4-3 6a3 3 0 0 0 6 0c0-2-1-4-3-6z" fill="currentColor" opacity="0.4" />
            </svg>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2E3A1F]">
                {aiTrustData.score}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#3B3028]">
                /{aiTrustData.maxScore}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#3D5220] ml-1.5 whitespace-nowrap">
                {aiTrustData.level}
              </span>
            </div>

            <p className="text-xs text-[#786E65] font-semibold mt-1 leading-tight">
              Your produce is safe and trustworthy.
            </p>
          </div>
        </div>

        {/* Right: Smooth Upward-Trending Line Chart */}
        <div className="w-32 sm:w-40 h-14 relative flex items-end justify-end pointer-events-none flex-shrink-0">
          <svg viewBox="0 0 120 50" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="aiGraphBlendGradFinal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#556B2F" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#556B2F" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Gradient Filled Area Below Curve */}
            <path 
              d="M 5 42 C 30 38, 55 28, 80 18 T 115 8 L 115 48 L 5 48 Z" 
              fill="url(#aiGraphBlendGradFinal)" 
            />

            {/* Smooth Upward Line */}
            <path 
              d="M 5 42 C 30 38, 55 28, 80 18 T 115 8" 
              fill="none" 
              stroke="#556B2F" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />

            {/* Plotted Data Points */}
            <circle cx="5" cy="42" r="3" fill="#556B2F" />
            <circle cx="42" cy="33" r="3" fill="#556B2F" />
            <circle cx="80" cy="18" r="3" fill="#556B2F" />
            <circle cx="115" cy="8" r="4.5" fill="#2E3A1F" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Centered View Details Action Button */}
      <div className="pt-1 flex justify-center">
        <button 
          onClick={onOpenDetails}
          className="text-xs font-bold text-[#3B3028] hover:text-[#556B2F] transition-colors py-1.5 px-4 rounded-lg bg-[#FAF7F0] border border-[#E6E1D5]"
        >
          View Details
        </button>
      </div>

      {/* Retained: AI Verification Checkpoints Section */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#E6E1D5]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#786E65]">
          AI Verification Checkpoints
        </h3>
        {aiTrustData.aiVerificationDetails.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#3D5220]" />
              <span className="font-bold text-[#3B3028]">{item.title}</span>
            </div>
            <span className="font-bold text-[#3D5220]">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
