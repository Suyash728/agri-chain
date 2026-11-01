import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

const ROLE_INFO = {
  farmer: {
    title: 'Farmer Portal',
    icon: '🌿',
    badge: 'Farm-Gate Origin & Produce Tokenization',
    subtitle: 'Anchoring harvest lot hashes & soil intelligence to blockchain',
    color: '#3D4E2A',
  },
  logistics: {
    title: 'SafeXpress Cold Chain',
    icon: '🚛',
    badge: 'IoT Reefer Telemetry & Transit Custody',
    subtitle: 'Streaming real-time temperature telemetry & route validation',
    color: '#354424',
  },
  darkstore: {
    title: 'Dark Store Fulfillment',
    icon: '🏬',
    badge: 'Micro-Fulfillment Hub & FEFO Inventory',
    subtitle: 'Inbound GRN verification & dynamic markdown inventory management',
    color: '#3D4E2A',
  },
  consumer: {
    title: 'Consumer Marketplace',
    icon: '🛒',
    badge: '100% Farm-to-Fork Provenance',
    subtitle: 'Verifying origin certificates, fair farmer share & product journey',
    color: '#354424',
  },
  admin: {
    title: 'Master Governance',
    icon: '⚡',
    badge: 'Smart Contract Circuit Breakers',
    subtitle: 'Monitoring AI trust anomaly verifications & decentralized oracle relayers',
    color: '#3D4E2A',
  },
};

const STATUS_MESSAGES = [
  'Initializing AgriChain decentralized node...',
  'Connecting to Polygon Amoy trust oracle...',
  'Verifying AI trust layer telemetry integrity...',
  'Syncing cryptographic custody transitions...',
  'Securing immutable ledger & loading portal...',
];

export const SplashScreen = ({ role = 'farmer', onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [logoOpacity, setLogoOpacity] = useState(0);

  const roleData = ROLE_INFO[role] || ROLE_INFO.farmer;
  const TOTAL_DURATION_MS = 5500; // 5.5 seconds total

  useEffect(() => {
    // 1. Initial fade-in of logo
    const fadeInTimer = setTimeout(() => {
      setLogoOpacity(1);
    }, 80);

    // 2. Smooth progress bar advancement every 50ms
    const intervalTime = 50;
    const progressStep = 100 / (TOTAL_DURATION_MS / intervalTime);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + progressStep;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // 3. Dynamic status text rotation
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1100);

    // 4. Trigger smooth fade out of logo & screen at 4.9s
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
      setLogoOpacity(0);
    }, 4900);

    // 5. Complete splash screen at 5.5s
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(fadeInTimer);
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setLogoOpacity(0);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-8 bg-[#FAF7F0] select-none transition-all duration-700 ease-out overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 25%, rgba(227, 235, 211, 0.45) 0%, rgba(250, 247, 240, 0.95) 60%, rgba(234, 229, 217, 1) 100%)',
      }}
    >
      {/* Top Header: Network Pill & Skip Button */}
      <div className="w-full max-w-xl flex items-center justify-between z-10 pt-2 animate-fade-in">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E6E1D5] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-black text-[#2D2620] tracking-wide">
            AGRICHAIN • MAINNET READY
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs font-bold text-[#666057] hover:text-[#2D2620] bg-white/70 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E6E1D5] transition-all cursor-pointer flex items-center gap-1 shadow-2xs group"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Center: Animated Logo with Breathing Glow & Typography */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 max-w-md w-full px-4">
        {/* Logo Container with Smooth Fade & Pulse Effect */}
        <div 
          className="relative transition-all duration-1000 ease-in-out transform"
          style={{
            opacity: logoOpacity,
            transform: logoOpacity === 1 ? 'scale(1)' : 'scale(0.92)',
          }}
        >
          {/* Ambient Glowing Halo */}
          <div className="absolute -inset-4 bg-[#3D4E2A]/15 rounded-[2.5rem] blur-xl animate-pulse" />

          {/* Logo Card */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white border border-[#E6E1D5] p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            <img 
              src="/images/agrichain_logo.png" 
              alt="AgriChain Official Logo" 
              className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div 
          className="mt-6 flex flex-col items-center gap-1 transition-all duration-700 delay-150"
          style={{
            opacity: logoOpacity,
            transform: logoOpacity === 1 ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <h1 className="text-3xl sm:text-4xl font-black text-[#2D2620] tracking-tight leading-none flex items-center gap-2">
            <span>AgriChain</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#666057] mt-1 max-w-xs">
            Decentralized Agricultural Traceability & AI Trust Layer
          </p>
        </div>

        {/* Role Portal Indicator Card */}
        <div 
          className="mt-6 w-full p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E6E1D5] shadow-xs flex flex-col items-center gap-1.5 transition-all duration-700 delay-300"
          style={{
            opacity: logoOpacity,
            transform: logoOpacity === 1 ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{roleData.icon}</span>
            <span className="text-xs font-black text-[#2D2620] tracking-wide uppercase">
              {roleData.title}
            </span>
            <span className="text-[10px] font-extrabold text-[#3D4E2A] bg-[#EBF3E8] px-2 py-0.5 rounded-full border border-[#C2E0B8]">
              Active Portal
            </span>
          </div>

          <p className="text-[11px] font-medium text-[#786E65] text-center leading-snug">
            {roleData.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom: Progress Bar & Status Text */}
      <div className="w-full max-w-md flex flex-col items-center gap-2.5 z-10 pb-2">
        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-[#E6E1D5]/70 rounded-full overflow-hidden p-0.5 border border-[#E6E1D5]">
          <div 
            className="h-full bg-gradient-to-r from-[#3D4E2A] via-[#556B2F] to-[#354424] rounded-full transition-all duration-100 ease-linear shadow-xs"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>

        {/* Status Line */}
        <div className="w-full flex items-center justify-between text-[11px] font-bold text-[#666057] px-1">
          <span className="flex items-center gap-1.5 animate-pulse truncate max-w-[80%]">
            <Sparkles className="w-3.5 h-3.5 text-[#3D4E2A] flex-shrink-0" />
            <span className="truncate">{STATUS_MESSAGES[statusIndex]}</span>
          </span>
          <span className="font-mono text-[#2D2620] flex-shrink-0">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
