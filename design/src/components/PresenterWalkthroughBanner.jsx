import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  Compass,
  Zap
} from 'lucide-react';

const WALKTHROUGH_STEPS = [
  {
    step: 1,
    role: 'farmer',
    tab: 'dashboard',
    badge: '1. Farm Gate Origin',
    title: 'Farmer harvests & anchors produce batch',
    instruction: 'View registered crop lots, seed new batches, and verify farm-gate guaranteed minimum prices.',
    actionLabel: 'Next: In-Transit Logistics →',
    targetRole: 'logistics',
    targetTab: 'dashboard',
  },
  {
    step: 2,
    role: 'logistics',
    tab: 'dashboard',
    badge: '2. Cold Chain Logistics',
    title: 'SafeXpress transports with continuous IoT',
    instruction: 'Monitor real-time reefer temperatures, highway GPS routes, and verified condition handoffs.',
    actionLabel: 'Next: Dark Store Intake →',
    targetRole: 'darkstore',
    targetTab: 'dashboard',
  },
  {
    step: 3,
    role: 'darkstore',
    tab: 'dashboard',
    badge: '3. Dark Store Micro-Hub',
    title: 'Inbound GRN, Spoilage Checks & FEFO Storage',
    instruction: 'Inspect inbound lot quality, automated FEFO expiry alerts, and dynamic markdown safeguards.',
    actionLabel: 'Next: Consumer Provenance →',
    targetRole: 'consumer',
    targetTab: 'home',
  },
  {
    step: 4,
    role: 'consumer',
    tab: 'home',
    badge: '4. Consumer QR Passport',
    title: 'Transparent price breakdown & verified reviews',
    instruction: 'Click any produce card to inspect immutable on-chain custody hops, IoT checkpoints & post-sale reviews.',
    actionLabel: 'Restart Tour ↺',
    targetRole: 'farmer',
    targetTab: 'dashboard',
  },
];

export const PresenterWalkthroughBanner = ({ 
  currentRole, 
  onNavigateRoleAndTab,
  onOpenShowcaseLab,
  onOpenGodMode
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (isDismissed) return null;

  const activeStep = WALKTHROUGH_STEPS[currentStepIdx];

  const handleNext = () => {
    const nextIdx = (currentStepIdx + 1) % WALKTHROUGH_STEPS.length;
    setCurrentStepIdx(nextIdx);
    const target = WALKTHROUGH_STEPS[currentStepIdx];
    onNavigateRoleAndTab(target.targetRole, target.targetTab);
  };

  const handlePrev = () => {
    const prevIdx = (currentStepIdx - 1 + WALKTHROUGH_STEPS.length) % WALKTHROUGH_STEPS.length;
    setCurrentStepIdx(prevIdx);
    const target = WALKTHROUGH_STEPS[prevIdx];
    onNavigateRoleAndTab(target.role, target.tab);
  };

  return (
    <div className="fixed top-[70px] left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl animate-fade-in transition-all">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E6E1D5] shadow-lg p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs">
        
        {/* Left: Step Badge & Title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#354424] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Compass className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-[#354424] bg-emerald-50 px-2 py-0.5 rounded-full border border-[#E6E1D5]">
                {activeStep.badge}
              </span>
              <span className="text-[10px] font-bold text-[#666057]">
                Step {activeStep.step} of 4
              </span>
            </div>
            {!isMinimized && (
              <p className="font-extrabold text-xs text-[#2D2620] truncate mt-0.5">
                {activeStep.title}
              </p>
            )}
          </div>
        </div>

        {/* Center / Right: Interactive Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onOpenGodMode}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs hover:brightness-110"
            title="Launch 4-Quadrant Omniscient God Mode"
          >
            <Sparkles className="w-3 h-3 fill-white" />
            <span className="hidden sm:inline">God Mode</span>
          </button>

          <button
            onClick={onOpenShowcaseLab}
            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Open Demo Lab Drawer"
          >
            <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
            <span className="hidden sm:inline">Demo Lab</span>
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="p-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E6E1D5] text-[#2D2620] disabled:opacity-30 cursor-pointer transition-all"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            className="px-3 py-1.5 rounded-xl bg-[#354424] hover:bg-[#2D3B1E] text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
          >
            <span>{activeStep.actionLabel}</span>
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-xl text-[#666057] hover:bg-[#FAF7F0] cursor-pointer"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-xl text-[#666057] hover:bg-[#FAF7F0] cursor-pointer"
            title="Dismiss Tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
