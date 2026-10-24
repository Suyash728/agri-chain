import React, { useState, useEffect } from 'react';
import { Leaf, ShieldCheck, UserCheck, ArrowRight, User, Sprout } from 'lucide-react';

export const OnboardingView = ({ 
  onGetStarted, 
  onContinueAsGuest, 
  onLogin 
}) => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [startAnim, setStartAnim] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
      setStartAnim(true);
      const fadeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 400);
      return () => clearTimeout(fadeTimer);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#FAF8EF] text-[#243021] flex flex-col justify-between overflow-x-hidden font-sans select-none pb-10 pt-4 px-6 md:px-12 lg:px-16">
      
      {/* 0. Minimal 1-2 Second Fast Splash Screen Overlay (Exact cream background & centered circular logo) */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-50 bg-[#FAF8EF] flex items-center justify-center transition-opacity duration-400 ease-out select-none ${
            splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#3D4E2A] flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-7 h-7 md:w-8 md:h-8 text-[#FAF7F0]" />
          </div>
        </div>
      )}
      
      {/* Embedded CSS Keyframes for Premium Entrance Animation (Runs on landing load) */}
      <style>{`
        @keyframes heroFloatUp {
          0% {
            opacity: 0;
            transform: translateY(35px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-hero-item {
          opacity: 0;
        }
        .animate-hero-item.run-anim {
          animation: heroFloatUp 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 1. HERO BACKGROUND: Full-Screen Realistic Agricultural Landscape & Wooden Crate */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <img 
          src="/images/landing_farm_hero.jpg" 
          alt="Realistic Agricultural Landscape & Fresh Produce Crate" 
          className="w-full h-full object-cover object-right-bottom opacity-100"
        />
        {/* 2. GRADIENT OVERLAY: Subtle cream gradient ONLY on the left for text readability */}
        <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-[#FAF8EF] via-[#FAF8EF]/80 to-transparent pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#FAF8EF]/90 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#FAF8EF] via-[#FAF8EF]/70 to-transparent pointer-events-none" />
      </div>

      {/* Top Header Row: Top-Left Branding (Logo stays exactly in place) */}
      <div className={`relative z-20 flex justify-between items-center w-full max-w-7xl mx-auto pt-2 pb-1 animate-hero-item ${startAnim ? 'run-anim' : ''}`} style={{ animationDelay: '0ms' }}>
        
        {/* Top-Left Branding: Dark-Green Circular Logo + AgriChain Brand Name */}
        <div className="flex items-center gap-2.5 my-auto">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#3D4E2A] flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Sprout className="w-5 h-5 md:w-6 md:h-6 text-[#FAF7F0]" />
          </div>
          <span className="text-xl md:text-2xl font-black text-[#294522] tracking-tight leading-none self-center">
            AgriChain
          </span>
        </div>

      </div>

      {/* Main Responsive Landing Grid Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col justify-between pt-4 md:pt-6 pb-2 md:pb-6">
        
        {/* LEFT SIDE CONTENT: Headline, Subtitle, 3 Benefit Items (Gap matching reference image media_1787160900726.jpg) */}
        <div className="flex flex-col gap-6 md:gap-8 max-w-xl md:max-w-2xl mt-1 md:mt-2">
          
          {/* Main Hero Headline (Staggered Entrance Animation) */}
          <h1 
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#294522] leading-[1.12] tracking-tight drop-shadow-xs animate-hero-item ${startAnim ? 'run-anim' : ''}`}
            style={{ animationDelay: '120ms' }}
          >
            Farm Fresh, <br />
            Delivered With Trust
          </h1>

          {/* Supporting Subtitle (Staggered Entrance Animation) */}
          <p 
            className={`text-base sm:text-lg md:text-xl font-medium text-[#596052] leading-snug max-w-lg animate-hero-item ${startAnim ? 'run-anim' : ''}`}
            style={{ animationDelay: '240ms' }}
          >
            Handpicked produce from trusted farmers, <br className="hidden sm:inline" />
            delivered fresh to your doorstep.
          </p>

          {/* Three Vertically Stacked Benefit Items */}
          <div className="flex flex-col gap-4 sm:gap-5 mt-1 sm:mt-3">
            
            {/* Benefit 1: 100% Natural */}
            <div 
              className={`flex items-center gap-4 animate-hero-item ${startAnim ? 'run-anim' : ''}`}
              style={{ animationDelay: '360ms' }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E8EED0] text-[#294522] flex items-center justify-center shadow-xs flex-shrink-0">
                <Leaf className="w-6 h-6 sm:w-7 sm:h-7 text-[#294522] fill-[#294522]/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg md:text-xl font-extrabold text-[#294522] leading-tight">
                  100% Natural
                </span>
                <span className="text-xs sm:text-sm md:text-base font-medium text-[#596052] leading-snug">
                  Pure, healthy and chemical free.
                </span>
              </div>
            </div>

            {/* Benefit 2: Trusted Farmers */}
            <div 
              className={`flex items-center gap-4 animate-hero-item ${startAnim ? 'run-anim' : ''}`}
              style={{ animationDelay: '480ms' }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E8EED0] text-[#294522] flex items-center justify-center shadow-xs flex-shrink-0">
                <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#294522]" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg md:text-xl font-extrabold text-[#294522] leading-tight">
                  Trusted Farmers
                </span>
                <span className="text-xs sm:text-sm md:text-base font-medium text-[#596052] leading-snug">
                  Supporting local farmers and communities.
                </span>
              </div>
            </div>

            {/* Benefit 3: Safe & Secure */}
            <div 
              className={`flex items-center gap-4 animate-hero-item ${startAnim ? 'run-anim' : ''}`}
              style={{ animationDelay: '600ms' }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E8EED0] text-[#294522] flex items-center justify-center shadow-xs flex-shrink-0">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#294522]" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg md:text-xl font-extrabold text-[#294522] leading-tight">
                  Safe & Secure
                </span>
                <span className="text-xs sm:text-sm md:text-base font-medium text-[#596052] leading-snug">
                  Hygienically packed and safely delivered.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Action Section: Primary CTA, Secondary CTA, Login Link */}
        <div 
          className={`flex flex-col items-center gap-4 pt-6 md:pt-8 w-full max-w-md mx-auto md:mx-0 animate-hero-item ${startAnim ? 'run-anim' : ''}`}
          style={{ animationDelay: '720ms' }}
        >
          {/* Primary Button: Get Started → */}
          <button
            onClick={onGetStarted}
            className="w-full py-4 sm:py-4.5 px-8 rounded-full bg-[#294522] hover:bg-[#1E3319] text-white font-extrabold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
          </button>

          {/* Secondary Button: Continue as Guest */}
          <button
            onClick={onContinueAsGuest}
            className="w-full py-3.5 sm:py-4 px-8 rounded-full bg-white/70 backdrop-blur-xs border border-[#294522]/30 hover:border-[#294522] hover:bg-white text-[#294522] font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <User className="w-5 h-5 text-[#294522]" />
            <span>Continue as Guest</span>
          </button>

          {/* Footer Login Link */}
          <div className="text-center pt-1">
            <span className="text-sm sm:text-base font-medium text-[#596052]">
              Already have an account?{' '}
            </span>
            <button
              onClick={onLogin}
              className="text-sm sm:text-base font-extrabold text-[#294522] hover:underline cursor-pointer ml-1 inline-block"
            >
              Log In
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
