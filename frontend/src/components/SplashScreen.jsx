import React, { useState, useEffect } from 'react';

const AGRI_LINES = [
  "From sacred soil to every home — honoring the hands that feed the nation.",
  "Rooted in the earth, nurtured by honest hands, verified with unwavering trust.",
  "Every harvest tells a story of patience, devotion, and respect for the soil.",
  "Sustaining the land that sustains our nation — pure, honest, from farm to fork.",
];

export const SplashScreen = ({ role = 'farmer', onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Pick a nice agricultural quote based on role or randomized
  const [agriLine] = useState(() => {
    if (role === 'farmer') return AGRI_LINES[0];
    if (role === 'logistics') return "Preserving harvest freshness from farm gate to destination with cold-chain care.";
    if (role === 'darkstore') return "Bridging farmers with urban communities through fair-share food distribution.";
    if (role === 'consumer') return "Know your food, respect the farmer, celebrate authentic produce origin.";
    return AGRI_LINES[0];
  });

  const TOTAL_DURATION_MS = 5200; // ~5.2 seconds

  useEffect(() => {
    // 1. Smooth fade-in
    const enterTimer = setTimeout(() => {
      setFadeIn(true);
    }, 60);

    // 2. Smooth leafy progress bar advancement (updates every 40ms)
    const intervalTime = 40;
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

    // 3. Initiate smooth fade-out at 4.6s
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 4650);

    // 4. Complete unmount at 5.2s
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(enterTimer);
      clearInterval(progressInterval);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF7F0] select-none transition-opacity duration-600 ease-in-out p-6 overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Centered Content: Logo, Agriculture Quote, and Leafy Loading Line */}
      <div 
        className={`flex flex-col items-center justify-center text-center max-w-xl w-full transition-all duration-700 ease-out ${
          fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Seamlessly Merged Logo */}
        <div className="w-80 sm:w-[26rem] md:w-[32rem] max-w-full flex items-center justify-center">
          <img 
            src="/images/agrichain_logo_clean.png" 
            alt="AgriChain Logo" 
            className="w-full h-auto object-contain mix-blend-multiply drop-shadow-xs transition-transform duration-1000 ease-in-out hover:scale-102"
          />
        </div>

        {/* Beautiful Inspiring Agriculture Quote */}
        <p className="mt-8 text-sm sm:text-base font-serif italic text-[#4A4036] max-w-md sm:max-w-lg leading-relaxed px-4 opacity-90">
          “{agriLine}”
        </p>

        {/* Leafy Loading Line */}
        <div className="mt-8 w-64 sm:w-80 md:w-96 relative flex flex-col items-center">
          {/* Subtle line glow and background track */}
          <div className="w-full h-2 bg-[#E2E8D5] rounded-full overflow-hidden relative shadow-inner">
            {/* Filled green botanical progress line */}
            <div 
              className="h-full bg-gradient-to-r from-[#4D7C26] via-[#6B9E3A] to-[#88B84D] rounded-full transition-all duration-75 ease-linear shadow-xs"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          {/* Traveling Sprout / Leaf Icon Gliding along the line */}
          <div 
            className="absolute -top-3.5 -ml-3 transition-all duration-75 ease-linear pointer-events-none"
            style={{ left: `${Math.min(97, Math.max(1, progress))}%` }}
          >
            <span className="text-lg filter drop-shadow-xs inline-block animate-bounce">
              🌱
            </span>
          </div>

          {/* Leafy Loading Caption */}
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#5C7043] tracking-wide">
            <span>🌿</span>
            <span>Nurturing from soil to plate...</span>
            <span className="font-mono text-[#3D4E2A] font-bold ml-1">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
