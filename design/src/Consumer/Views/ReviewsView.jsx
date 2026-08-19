import React from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { sampleReviews, ratingBreakdown } from '../data/consumerData';

export const ReviewsView = ({ onWriteReviewClick }) => {
  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        <h2 className="text-lg md:text-xl font-black text-[#2D2620]">Customer Ratings & Reviews</h2>

        {/* Product Card Header */}
        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#FAF7F0] p-1.5 flex items-center justify-center flex-shrink-0">
            <img src="/images/fruits_ref.png" alt="Alphonso Mango" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#2D2620]">Alphonso Mango</h3>
            <span className="text-xs font-semibold text-[#666057]">1 kg • Ratnagiri Origin</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Left Col: Rating Summary & Breakdown */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex items-center gap-6">
              {/* Left Large Rating */}
              <div className="flex flex-col items-center justify-center flex-shrink-0 pr-6 border-r border-[#E6E1D5]">
                <span className="text-4xl font-black text-[#2D2620]">4.6</span>
                <div className="flex items-center gap-0.5 text-amber-500 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-[#666057]">(128 Reviews)</span>
              </div>

              {/* Right Star Breakdown Bars */}
              <div className="flex-1 flex flex-col gap-1.5 text-xs font-bold text-[#666057]">
                {ratingBreakdown.map((row) => (
                  <div key={row.stars} className="flex items-center gap-2">
                    <span className="w-4 text-right">{row.stars}★</span>
                    <div className="flex-1 h-2 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#E6E1D5]">
                      <div 
                        className="h-full bg-[#354424] rounded-full" 
                        style={{ width: `${row.percentage}%` }} 
                      />
                    </div>
                    <span className="w-8 text-right font-extrabold text-[#2D2620]">{row.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write a Review Button */}
            <button
              onClick={onWriteReviewClick}
              className="w-full py-3.5 rounded-2xl bg-[#354424] text-white font-extrabold text-xs sm:text-sm shadow-md hover:bg-[#2D3B1E] transition-all cursor-pointer text-center"
            >
              Write a Review
            </button>
          </div>

          {/* Right Col: Reviews List */}
          <div className="flex flex-col gap-3">
            {sampleReviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-2.5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#354424] text-white font-extrabold text-xs flex items-center justify-center">
                      {rev.author[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620] flex items-center gap-1.5">
                        {rev.author}
                        <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700">{rev.badge}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#666057]">{rev.date}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="text-xs font-extrabold text-[#2D2620] ml-1">{rev.rating.toFixed(1)}</span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-[#2D2620] leading-snug">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
