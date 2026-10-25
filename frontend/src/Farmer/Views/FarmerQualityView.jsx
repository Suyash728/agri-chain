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

const initialQualityData = {
  score: 98,
  maxScore: 100,
  level: "Grade A+ Producer",
  status: "Certified Origin & Verified Harvest",
  grade: "Grade A (Prime)",
  totalBatches: 31,
  anchoredDocs: 12,
  reviewCount: 13,
  avgRating: 5.0,
  aiVerificationDetails: [
    { title: "Harvest Quality Grade", status: "Grade A (Export / Prime Standard)" },
    { title: "Farm Certifications (IPFS)", status: "12 Verified Certificates (IPFS)" },
    { title: "Fulfillment Reliability", status: "100% On-Time Batch Handover" },
    { title: "Consumer Satisfaction", status: "5.0/5.0 ★ (13 Buyer Reviews)" },
  ]
};

const sampleCertificates = [
  {
    docType: "NPOP Organic Certification",
    fileName: "NPOP-Organic-Nashik-2026.pdf",
    cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    authority: "APEDA India / SGS Laboratory",
    validTill: "Oct 2027",
    status: "Verified On-Chain"
  },
  {
    docType: "Pesticide Residue Free Test",
    fileName: "Zero-Residue-Lab-Test-MH402.pdf",
    cid: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
    authority: "Eurofins Agri-Testing India",
    validTill: "Batch Certified",
    status: "Verified On-Chain"
  },
  {
    docType: "Good Agricultural Practices (GAP)",
    fileName: "IndGAP-Compliance-Audit.pdf",
    cid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49BoKSreQzQ3gT1D3vH",
    authority: "Quality Council of India",
    validTill: "Dec 2026",
    status: "Verified On-Chain"
  }
];

const sampleReviews = [
  {
    reviewer: "Priya S. (Mumbai)",
    rating: 5,
    comment: "Extraordinarily fresh strawberries! QR journey scan showed harvested just yesterday in Mahabaleshwar.",
    crop: "Mahabaleshwar Strawberries",
    date: "2 days ago"
  },
  {
    reviewer: "Amitabh K. (Pune)",
    rating: 5,
    comment: "Crisp cluster tomatoes, perfect ripeness and zero bruising. Verified Grade A produce.",
    crop: "Vine-Ripened Cluster Tomatoes",
    date: "4 days ago"
  },
  {
    reviewer: "Rohit N. (Nashik)",
    rating: 5,
    comment: "Consistently top-tier harvest. Clean fair-trade price trail right on the package.",
    crop: "Nashik Red Onions",
    date: "1 week ago"
  }
];

export const FarmerQualityView = ({ onBack, onOpenTraceability }) => {
  const [qualityData, setQualityData] = useState(initialQualityData);

  const fetchQuality = () => {
    fetch('http://localhost:8000/farmer/quality-rating')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.score !== undefined) {
          setQualityData(data);
        }
      })
      .catch(() => {});
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
            <span className="text-sm font-black text-[#2D2620]">{qualityData.avgRating || '5.0'}</span>
            <span className="text-xs text-[#666057] font-semibold">({qualityData.reviewCount || '13'} Reviews)</span>
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
          {sampleCertificates.map((cert, idx) => (
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
          {sampleReviews.map((rev, idx) => (
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
