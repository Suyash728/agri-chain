import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, Star, CheckCircle, FileText, ExternalLink, X, QrCode } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import { getBatchQRCodeImageUrl, getBatchConsumerPassportUrl } from '../../utils/qrHelper';
import { LargeQRModal } from '../../components/LargeQRModal';

export const ProductJourneyView = ({ 
  selectedProduct, 
  onVerifyBlockchainClick,
  onWriteReviewClick,
  refreshKey 
}) => {
  const [liveProduct, setLiveProduct] = useState(selectedProduct);

  useEffect(() => {
    if (selectedProduct) {
      setLiveProduct(selectedProduct);
    } else {
      fetch(`${API_BASE_URL}/batches`)
        .then((res) => (res.ok ? res.json() : []))
        .then((batches) => {
          if (Array.isArray(batches) && batches.length > 0) {
            const b = batches[0];
            const isFruit = ['mango', 'banana', 'apple'].some(f => (b.crop_name || '').toLowerCase().includes(f));
            setLiveProduct({
              name: b.crop_name || 'Farm Fresh Produce',
              batchId: b.batch_id,
              origin: b.origin_farm || 'Nashik, Maharashtra',
              image: isFruit ? '/images/fruits_ref.png' : '/images/vegetables_ref.png'
            });
          }
        })
        .catch(() => {});
    }
  }, [selectedProduct]);

  const product = liveProduct || {
    name: 'Farm Fresh Produce',
    batchId: null,
    origin: 'Maharashtra, India',
    image: '/images/vegetables_ref.png'
  };

  const originCity = product.origin ? product.origin.split(',')[0].split('||')[0].trim() : 'Nashik';
  const displayBatchId = product.batchId;

  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [liveReviews, setLiveReviews] = useState(null);
  const [batchIncident, setBatchIncident] = useState(null);
  const [isQRZoomOpen, setIsQRZoomOpen] = useState(false);

  useEffect(() => {
    if (!displayBatchId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/batches/${displayBatchId}/traceability`)
      .then(res => {
        if (!res.ok) throw new Error('Traceability not found');
        return res.json();
      })
      .then(data => {
        setJourneyData(data);
        setLoading(false);
        if (data && (!liveProduct?.name || liveProduct.name === 'Produce Batch')) {
          const isFruit = ['mango', 'banana', 'apple'].some(f => (data.product || '').toLowerCase().includes(f));
          setLiveProduct(prev => ({
            ...prev,
            name: data.product || prev?.name || 'Organic Produce',
            batchId: data.batchId,
            origin: data.farmDetails || data.currentLocation || prev?.origin || 'Nashik, Maharashtra',
            image: isFruit ? '/images/fruits_ref.png' : '/images/vegetables_ref.png'
          }));
        }
      })
      .catch(err => {
        console.error('Error fetching batch traceability:', err);
        setLoading(false);
      });

    fetch(`${API_BASE_URL}/incidents/spoilage?batch_id=${displayBatchId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.incidents && data.incidents.length > 0) {
          setBatchIncident(data.incidents[0]);
        } else {
          setBatchIncident(null);
        }
      })
      .catch(() => setBatchIncident(null));

    fetch(`${API_BASE_URL}/batches/${displayBatchId}/documents`)
      .then(res => res.json())
      .then(docs => setDocuments(Array.isArray(docs) ? docs : []))
      .catch(() => {});

    fetch(`${API_BASE_URL}/batches/${displayBatchId}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data && data.reviews && data.reviews.length > 0) {
          setLiveReviews(data);
        }
      })
      .catch(() => {});
  }, [displayBatchId, refreshKey]);

  const today = new Date();
  const formatDateOffset = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const timelineSteps = [
    { title: 'Harvested', date: formatDateOffset(4), location: `${originCity} Farm Gate`, pricePaise: 0 },
    { title: 'Processed & Inspected', date: formatDateOffset(3), location: `${originCity} Quality Hub`, pricePaise: 0 },
    { title: 'Transported', date: formatDateOffset(2), location: 'Safexpress Reefer Fleet', pricePaise: 120000 },
    { title: 'Received at Dark Store', date: formatDateOffset(1), location: `${originCity} Central Store`, pricePaise: 155000 },
    { title: 'Out for Delivery', date: formatDateOffset(0), location: 'Last-Mile Courier', pricePaise: 185000 },
    { title: 'Delivered', date: formatDateOffset(0), location: 'Customer Doorstep', pricePaise: 220000 }
  ];

  const stepsToRender = journeyData?.steps && journeyData.steps.length > 0
    ? journeyData.steps.map(s => ({
        title: s.name,
        date: s.timestamp,
        location: s.location,
        pricePaise: s.pricePaise || 0,
      }))
    : timelineSteps;

  // Dynamic reviews for the selected product
  const reviewsCount = liveReviews ? liveReviews.total_reviews : 0;
  const ratingScore = liveReviews ? liveReviews.average_rating : 5.0;

  const displayReviewsList = liveReviews && liveReviews.reviews && liveReviews.reviews.length > 0
    ? liveReviews.reviews.map(r => ({
        id: r.id,
        author: r.reviewer_address ? `${r.reviewer_address.substring(0, 6)}...${r.reviewer_address.substring(r.reviewer_address.length - 4)}` : 'Verified Consumer',
        badge: 'On-Chain Verified',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
        comment: r.comment,
        rating: r.rating,
      }))
    : [];

  const breakdownToRender = liveReviews && liveReviews.reviews && liveReviews.reviews.length > 0
    ? [5, 4, 3, 2, 1].map(stars => {
        const count = liveReviews.reviews.filter(r => r.rating === stars).length;
        const percentage = Math.round((count / liveReviews.reviews.length) * 100);
        return { stars, percentage };
      })
    : [5, 4, 3, 2, 1].map(stars => ({ stars, percentage: stars === 5 ? 100 : 0 }));

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        <h2 className="text-lg md:text-xl font-black text-[#2D2620]">Farm-to-Door Traceability Journey</h2>

        {/* Responsive 2-Column Split on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Left Column: Product Info Card, Trust Card, AND Product-Specific Reviews */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-[#F8F5EE] p-2 flex items-center justify-center flex-shrink-0 border border-[#E6E1D5] overflow-hidden">
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                </div>

                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-[#2D2620] truncate">
                      {product.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3E8] text-[#556B2F] text-[10px] font-extrabold flex-shrink-0">
                      Verified
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#666057] truncate">
                    Origin: {product.origin || 'Nashik, Maharashtra'}
                  </span>
                  <span className="text-[11px] font-mono text-[#3D4E2A] font-bold">
                    Batch: #{displayBatchId || 'Pending'}
                  </span>
                </div>
              </div>

              {displayBatchId && (
                <div
                  onClick={() => setIsQRZoomOpen(true)}
                  title="Click to view large full-screen QR code"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#FAF7F0] p-1.5 border-2 border-[#E6E1D5] hover:border-[#556B2F] flex flex-col items-center justify-center flex-shrink-0 shadow-xs cursor-pointer transition-all hover:scale-105 group"
                >
                  <img 
                    src={getBatchQRCodeImageUrl(displayBatchId, 200)}
                    alt={`Batch QR #${displayBatchId}`}
                    className="w-16 h-16 sm:w-18 sm:h-18 object-contain"
                  />
                  <span className="text-[7.5px] font-black tracking-wider text-[#556B2F] mt-1 group-hover:text-[#2D2620]">
                    SCAN / ZOOM
                  </span>
                </div>
              )}
            </div>

            {/* Supply Chain Spoilage & Quality Recall Warning if incident recorded */}
            {batchIncident && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black text-red-900">
                    <span>⚠️</span> Thermal Failure & Spoilage Intercepted
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black">
                    {batchIncident.severity}
                  </span>
                </div>
                <p className="text-[11px] text-red-700 leading-snug">{batchIncident.details}</p>
                <div className="flex items-center justify-between pt-1 border-t border-red-200 text-[10px] font-bold text-red-800">
                  <span>Goods Loss: {batchIncident.loss_goods_kg} kg degraded</span>
                  <span>Financial Loss: -₹{batchIncident.total_loss_inr.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Trust & Blockchain Verification Card */}
            <div 
              onClick={() => onVerifyBlockchainClick && onVerifyBlockchainClick({ ...product, batchId: displayBatchId, journeyData })}
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
                  View Verified Origin Certificate →
                </span>
              </div>
            </div>

            {/* Decentralized IPFS Documents Card (Phase 9) */}
            <div 
              onClick={() => setShowDocModal(true)}
              className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex items-center justify-between cursor-pointer hover:bg-[#FAF7F0] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0F4E8] text-[#556B2F] flex items-center justify-center flex-shrink-0 border border-[#D5E2C6]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620]">
                    Quality Certificates & Lab Reports
                  </h4>
                  <span className="text-[11px] font-semibold text-[#666057] block">
                    {documents.length > 0 
                      ? `${documents.length} verified decentralized IPFS document(s)` 
                      : 'AGMARK Organic Certification anchored'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#EBF3E8] text-[#556B2F] text-[11px] font-black border border-[#C2E0B8] flex items-center gap-1">
                Inspect CIDs →
              </span>
            </div>

            {/* Product-Specific Reviews Section (Embedded directly below Blockchain section) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#F4F5E6]">
                <h3 className="font-extrabold text-sm sm:text-base text-[#2D2620]">
                  Customer Ratings & Reviews ({reviewsCount})
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
                  <span className="text-3xl font-black text-[#2D2620]">{Number(ratingScore).toFixed(1)}</span>
                  <div className="flex items-center gap-0.5 text-amber-500 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-[#666057]">({reviewsCount} Reviews)</span>
                </div>

                <div className="flex-1 flex flex-col gap-1 text-[11px] font-bold text-[#666057]">
                  {breakdownToRender.map((row) => (
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
                {displayReviewsList.map((rev) => (
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
                        <Star 
                          key={s} 
                          className={`w-3 h-3 ${s <= (rev.rating || 5) ? 'fill-amber-500 text-amber-500' : 'text-[#E6E1D5]'}`} 
                        />
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

            {stepsToRender.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3.5 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#354424] text-white flex items-center justify-center flex-shrink-0 shadow-xs border-2 border-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620]">
                      {step.title}
                    </h4>
                    {step.pricePaise > 0 && (
                      <span className="text-[11px] font-black text-[#354424] bg-[#EBF3E8] px-2 py-0.5 rounded-full border border-[#C2E0B8]">
                        ₹{(step.pricePaise / 100).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
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

      {/* IPFS Documents Inspection Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E1D5] shadow-xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-[#F4F5E6]">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#2D2620] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#556B2F]" />
                  Decentralized IPFS Documents
                </h3>
                <p className="text-xs text-[#666057] font-semibold mt-0.5">
                  Batch #{displayBatchId} produce certifications anchored immutably on IPFS
                </p>
              </div>
              <button 
                onClick={() => setShowDocModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#2D2620] hover:bg-[#E6E1D5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#666057] font-semibold bg-[#FAF7F0] rounded-2xl border border-[#E6E1D5] p-4">
                  No decentralized quality certificates attached to this batch yet.
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div key={idx} className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#354424] text-white text-[10px] font-extrabold uppercase">
                      {doc.doc_type || 'CERTIFICATE'}
                    </span>
                    <span className="text-[10px] text-[#666057] font-bold">
                      {doc.uploaded_at ? String(doc.uploaded_at).slice(0, 16) : 'Verified'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620]">
                    {doc.file_name}
                  </h4>

                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-[#E6E1D5] text-[11px] font-mono text-[#556B2F] break-all">
                    <span>CID:</span>
                    <span className="font-bold flex-1">{doc.ipfs_cid}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ Anchored On-Chain
                    </span>
                    <a
                      href={doc.gateway_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#556B2F] text-white text-xs font-bold hover:bg-[#435525] transition-colors"
                    >
                      View on Gateway
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )))}
            </div>

            <button
              onClick={() => setShowDocModal(false)}
              className="mt-2 w-full py-2.5 rounded-full bg-[#354424] text-white font-extrabold text-xs shadow-xs hover:bg-[#2D3B1E] transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Large QR Zoom Modal */}
      <LargeQRModal
        isOpen={isQRZoomOpen}
        onClose={() => setIsQRZoomOpen(false)}
        batchId={displayBatchId}
        cropName={product.name}
        origin={product.origin}
      />
    </div>
  );
};
