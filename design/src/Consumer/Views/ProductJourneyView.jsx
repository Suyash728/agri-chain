import React from 'react';
import { CheckCircle2, ShieldCheck, Star, CheckCircle } from 'lucide-react';
import { productReviewsData } from '../data/consumerData';

export const ProductJourneyView = ({ 
  selectedProduct, 
  onVerifyBlockchainClick,
  onWriteReviewClick 
}) => {
  // Use selectedProduct if passed, otherwise fallback to default
  const product = selectedProduct || {
    name: 'Organic Tomato',
    batchId: 'TM1256',
    origin: 'Nashik, Maharashtra',
    image: '/images/vegetables_ref.png'
  };

  const originCity = product.origin ? product.origin.split(',')[0] : 'Nashik';
  const displayBatchId = product.batchId ? product.batchId : 'TM1256';

  const timelineSteps = [
    { title: 'Harvested', date: '05 May, 2025', location: `${originCity} Farm` },
    { title: 'Processed', date: '06 May, 2025', location: `${originCity} Packing Unit` },
    { title: 'Transported', date: '07 May, 2025', location: 'Green Valley Logistics' },
    { title: 'Received at Dark Store', date: '08 May, 2025', location: `${originCity} Central Store` },
    { title: 'Out for Delivery', date: '09 May, 2025', location: 'Local Courier Service' },
    { title: 'Delivered', date: '10 May, 2025', location: 'Customer Doorstep' }
  ];

  // Dynamic reviews for the selected product
  const reviewsInfo = productReviewsData[product.name] || productReviewsData['Organic Tomato'];

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        <h2 className="text-lg md:text-xl font-black text-[#2D2620]">Farm-to-Door Traceability Journey</h2>

        {/* Responsive 2-Column Split on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Left Column: Product Info Card, Trust Card, AND Product-Specific Reviews */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#F8F5EE] p-2 flex items-center justify-center flex-shrink-0 border border-[#E6E1D5] overflow-hidden">
                <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-[#2D2620]">
                    {product.name} <span className="text-[#666057] font-semibold text-xs">(Batch #{displayBatchId})</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3E8] text-[#556B2F] text-[10px] font-extrabold">
                    Verified
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#666057]">
                  Origin: {product.origin || 'Nashik, Maharashtra'}
                </span>
              </div>
            </div>

            {/* Trust & Blockchain Verification Card */}
            <div 
              onClick={() => onVerifyBlockchainClick && onVerifyBlockchainClick(product)}
              className="bg-[#EBF3E8] rounded-2xl p-5 border border-[#C2E0B8] shadow-xs flex items-center gap-4 cursor-pointer hover:bg-[#E2F0DD] transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#354424] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-extrabold text-[#354424] leading-snug">
                  This product is 100% traceable from farm to your doorstep.
                </p>
                <span className="text-xs font-black text-[#556B2F] underline mt-1 block">
                  View Blockchain Verification Record →
                </span>
              </div>
            </div>

            {/* Product-Specific Reviews Section (Embedded directly below Blockchain section) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#F4F5E6]">
                <h3 className="font-extrabold text-sm sm:text-base text-[#2D2620]">
                  Customer Ratings & Reviews ({reviewsInfo.reviewsCount})
                </h3>
                <button
                  onClick={onWriteReviewClick}
                  className="px-3 py-1.5 rounded-full bg-[#354424] text-white font-extrabold text-xs shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer"
                >
                  Write Review
                </button>
              </div>

              {/* Rating Summary & Breakdown Bars */}
              <div className="flex items-center gap-5 pt-1">
                <div className="flex flex-col items-center justify-center pr-5 border-r border-[#E6E1D5] flex-shrink-0">
                  <span className="text-3xl font-black text-[#2D2620]">{reviewsInfo.rating.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5 text-amber-500 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-[#666057]">({reviewsInfo.reviewsCount} Reviews)</span>
                </div>

                <div className="flex-1 flex flex-col gap-1 text-[11px] font-bold text-[#666057]">
                  {reviewsInfo.breakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2">
                      <span className="w-3 text-right">{row.stars}★</span>
                      <div className="flex-1 h-2 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#E6E1D5]">
                        <div 
                          className="h-full bg-[#354424] rounded-full" 
                          style={{ width: `${row.percentage}%` }} 
                        />
                      </div>
                      <span className="w-7 text-right font-extrabold text-[#2D2620]">{row.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Customer Reviews List */}
              <div className="flex flex-col gap-3 pt-2">
                {reviewsInfo.reviews.map((rev) => (
                  <div key={rev.id} className="bg-[#FAF7F0] rounded-xl p-3.5 border border-[#E6E1D5] flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#354424] text-white font-extrabold text-xs flex items-center justify-center">
                          {rev.author[0]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-[#2D2620] flex items-center gap-1">
                            {rev.author}
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                          </h4>
                          <span className="text-[10px] font-bold text-emerald-700">{rev.badge}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#666057]">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3 h-3 fill-amber-500 text-amber-500" />
                      ))}
                    </div>

                    <p className="text-xs font-medium text-[#2D2620] leading-snug">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Vertical Stepper Timeline */}
          <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-5 relative">
            <div className="absolute left-[31px] top-7 bottom-7 w-0.5 bg-[#354424]" />

            {timelineSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3.5 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#354424] text-white flex items-center justify-center flex-shrink-0 shadow-xs border-2 border-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 flex flex-col gap-0.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620]">
                    {step.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#666057]">
                    <span>{step.date}</span>
                    {step.location && (
                      <>
                        <span>|</span>
                        <span className="font-semibold text-[#354424]">{step.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
