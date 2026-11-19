import { API_BASE_URL } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  Award, 
  ShieldCheck, 
  FileText, 
  Star, 
  ExternalLink,
  Sprout,
  Sparkles,
  Link2
} from 'lucide-react';

// Neutral placeholder until /farmer/quality-rating answers (was a mock with invented counts)
const initialQualityData = {
  score: 0,
  maxScore: 100,
  level: "Loading…",
  status: "Fetching farm record",
  grade: "—",
  totalBatches: 0,
  anchoredDocs: 0,
  reviewCount: 0,
  avgRating: null,
  certificates: [],
  aiVerificationDetails: [
    { title: "Harvest Quality Grade", status: "Loading…" },
    { title: "Farm Certifications (IPFS)", status: "Loading…" },
    { title: "Fulfillment Reliability", status: "Loading…" },
    { title: "Consumer Satisfaction", status: "Loading…" },
  ]
};

export const FarmerQualityView = ({ onBack, onOpenTraceability }) => {
  const [qualityData, setQualityData] = useState(initialQualityData);
  const [buyerReviews, setBuyerReviews] = useState([]);

  const fetchQuality = () => {
    fetch(`${API_BASE_URL}/farmer/quality-rating`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.score !== undefined) {
          setQualityData(data);
        }
      })
      .catch(() => {});
    // Real post-sale reviews (replaces hard-coded sample reviews)
    fetch(`${API_BASE_URL}/consumer/reviews`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.reviews) ? data.reviews : [];
        setBuyerReviews(list.slice(0, 6).map((r) => ({
          reviewer: r.author,
          rating: r.rating,
          comment: r.comment,
          crop: r.cropName,
          date: r.date,
        })));
      })
      .catch(() => setBuyerReviews([]));
  };

  useEffect(() => {
    fetchQuality();
    window.addEventListener('agrichain-data-reset', fetchQuality);
    window.addEventListener('agrichain-data-updated', fetchQuality);
    return () => {
      window.removeEventListener('agrichain-data-reset', fetchQuality);
      window.removeEventListener('agrichain-data-updated', fetchQuality);
    };
  }, []);

  return (
    <div className="bg-white border border-[#E6E1D5] rounded-3xl p-4 sm:p-6 flex flex-col gap-6 shadow-xs max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors flex-shrink-0 border border-[#E6E1D5] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#3D4E2A] text-white">
                Farmer Reputation & Quality
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#3B3028] tracking-tight">
                Farm Quality & Harvest Certification
              </h1>
            </div>
            <p className="text-xs text-[#786E65] font-medium mt-0.5">
              Origin Farm Verification, IPFS Cryptographic Lab Tests & Verified Consumer Ratings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs font-bold text-[#354424]">
          <Award className="w-4 h-4 text-[#556B2F]" />
          <span>Prime Certified</span>
        </div>
      </div>

      {/* Main Reputation Score Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3D4E2A] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Award className="w-8 h-8 text-white" />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2D2620]">
                {qualityData.score}
              </span>
              <span className="text-sm font-bold text-[#666057]">/100</span>
              <span className="text-sm font-extrabold text-[#3D4E2A] ml-2">
                {qualityData.level}
              </span>
            </div>
            <p className="text-xs text-[#666057] mt-0.5 font-medium">
              {qualityData.status} • {qualityData.totalBatches} Batches Harvested & Verified.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-[#E6E1D5] shadow-2xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-sm font-black text-[#2D2620]">{qualityData.avgRating != null ? qualityData.avgRating : '—'}</span>
            <span className="text-xs text-[#666057] font-semibold">({qualityData.reviewCount ?? 0} Reviews)</span>
          </div>
        </div>
      </div>

      {/* 4 Farm Checkpoints */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-extrabold text-[#8C8275] uppercase tracking-wider block">
          HARVEST & PROVENANCE QUALITY CHECKPOINTS
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {qualityData.aiVerificationDetails && qualityData.aiVerificationDetails.map((cp, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF7F0]/80 border border-[#E6E1D5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#556B2F] flex-shrink-0" />
                <span className="font-extrabold text-[#2D2620]">{cp.title}</span>
              </div>
              <span className="font-bold text-[#354424] text-right ml-2">{cp.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* IPFS Cryptographic Lab Certificates */}
      <div className="space-y-3 pt-2 border-t border-[#E6E1D5]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#354424]" />
            <h2 className="text-sm sm:text-base font-extrabold text-[#2D2620]">
              Anchored Lab Certificates & Organic Compliance (IPFS)
            </h2>
          </div>
          <span className="text-xs font-bold text-[#556B2F]">
            Cryptographically Immutable
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(qualityData.certificates || []).length === 0 && (
            <div className="sm:col-span-3 p-4 rounded-2xl bg-[#FAF7F0] border border-dashed border-[#E6E1D5] text-xs text-[#666057]">
              No certificates uploaded yet. Upload a lab report or organic certificate from a batch to anchor it on IPFS.
            </div>
          )}
          {(qualityData.certificates || []).map((cert, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#E6E1D5] flex flex-col justify-between gap-2.5 shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30">
                    {cert.status}
                  </span>
                  <span className="text-[10px] text-[#8C8275] font-semibold">{cert.validTill}</span>
                </div>
                <h3 className="text-xs font-extrabold text-[#2D2620]">{cert.docType}</h3>
                <p className="text-[10px] text-[#666057] mt-0.5">{cert.authority}</p>
              </div>

              <div className="pt-2 border-t border-[#E6E1D5]/60 flex items-center justify-between">
                <span className="text-[9px] font-mono text-[#8C8275] truncate max-w-[150px]">
                  {cert.cid.slice(0, 16)}...
                </span>
                <span className="text-[10px] font-bold text-[#354424] inline-flex items-center gap-0.5">
                  <span>View CID</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Consumer Marketplace Reviews */}
      <div className="space-y-3 pt-2 border-t border-[#E6E1D5]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-sm sm:text-base font-extrabold text-[#2D2620]">
              Verified Consumer Ratings from Marketplace
            </h2>
          </div>
          <span className="text-xs font-bold text-[#666057]">
            Post-Sale Verified Purchases
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {buyerReviews.length === 0 && (
            <div className="sm:col-span-3 p-4 rounded-2xl bg-[#FAF7F0] border border-dashed border-[#E6E1D5] text-xs text-[#666057]">
              No buyer reviews yet. Reviews appear here after consumers buy and rate a batch.
            </div>
          )}
          {buyerReviews.map((rev, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-extrabold text-[#2D2620]">{rev.reviewer}</span>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[#4A3E36] italic leading-snug">
                  "{rev.comment}"
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#8C8275] font-semibold pt-1 border-t border-[#E6E1D5]/60">
                <span className="text-[#354424] font-bold">{rev.crop}</span>
                <span>{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
