import React from 'react';

// Category extracted crop artwork images wrapped in clean white rounded background boxes
export const FruitsIllustration = ({ className = "w-14 h-14 sm:w-16 sm:h-16" }) => (
  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/fruits_ref.png" 
      alt="Fruits" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const VegetablesIllustration = ({ className = "w-14 h-14 sm:w-16 sm:h-16" }) => (
  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/vegetables_ref.png" 
      alt="Vegetables" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const GrainsIllustration = ({ className = "w-14 h-14 sm:w-16 sm:h-16" }) => (
  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/grains_ref.png" 
      alt="Grains" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const PulsesIllustration = ({ className = "w-14 h-14 sm:w-16 sm:h-16" }) => (
  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/pulses_ref.png" 
      alt="Pulses & Legumes" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const SpicesIllustration = ({ className = "w-14 h-14 sm:w-16 sm:h-16" }) => (
  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/spices_ref.png" 
      alt="Spices" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const DryFruitsIllustration = ({ className = "w-14 h-14 sm:w-16 sm:h-16" }) => (
  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/dryfruits_ref.png" 
      alt="Dry Fruits & Nuts" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

// Individual Crop isolated artwork exports with white background box & smooth rounded edges
export const MangoIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/mango_only.png" 
      alt="Mango" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const BananaIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/banana_only.png" 
      alt="Banana" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const TomatoIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/tomato_only.png" 
      alt="Tomato" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const PotatoIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/potato_only.png" 
      alt="Potato" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const WheatIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/wheat_only.png" 
      alt="Wheat" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const RiceIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/rice_only.png" 
      alt="Rice" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const ChickpeaIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/chickpea_only.png" 
      alt="Chickpea" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const GreenGramIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/greengram_only.png" 
      alt="Green Gram" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const ChilliIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/chilli_only.png" 
      alt="Chilli" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const TurmericIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/turmeric_only.png" 
      alt="Turmeric" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const CashewIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/cashew_only.png" 
      alt="Cashew" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const AlmondIllustration = ({ className = "w-12 h-12" }) => (
  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#E6E1D5] shadow-xs overflow-hidden flex-shrink-0">
    <img 
      src="/images/almond_only.png" 
      alt="Almond" 
      className={`${className} object-contain filter drop-shadow-xs transition-transform duration-200 pointer-events-none select-none`} 
    />
  </div>
);

export const cropIllustrationsMap = {
  fruits: FruitsIllustration,
  vegetables: VegetablesIllustration,
  grains: GrainsIllustration,
  pulses: PulsesIllustration,
  spices: SpicesIllustration,
  dryfruits: DryFruitsIllustration,
};

export const individualCropIllustrationsMap = {
  "Mango": MangoIllustration,
  "Banana": BananaIllustration,
  "Tomato": TomatoIllustration,
  "Potato": PotatoIllustration,
  "Wheat": WheatIllustration,
  "Rice": RiceIllustration,
  "Chickpea": ChickpeaIllustration,
  "Green Gram": GreenGramIllustration,
  "Chilli": ChilliIllustration,
  "Turmeric": TurmericIllustration,
  "Cashew": CashewIllustration,
  "Almond": AlmondIllustration,
};

// KPI Card exact 3D artwork illustrations with seamless transparent background & larger sizing
export const SackIllustration = ({ className = "w-16 h-16 sm:w-20 sm:h-20" }) => (
  <img 
    src="/images/sack_kpi.png" 
    alt="Total Inventory" 
    className={`${className} object-contain pointer-events-none select-none filter drop-shadow-xs`} 
  />
);

export const ClipboardIllustration = ({ className = "w-16 h-16 sm:w-20 sm:h-20" }) => (
  <img 
    src="/images/clipboard_kpi.png" 
    alt="Active Orders" 
    className={`${className} object-contain pointer-events-none select-none filter drop-shadow-xs`} 
  />
);

export const TruckIllustration = ({ className = "w-16 h-16 sm:w-20 sm:h-20" }) => (
  <img 
    src="/images/truck_kpi.png" 
    alt="Shipments" 
    className={`${className} object-contain pointer-events-none select-none filter drop-shadow-xs`} 
  />
);

export const EarningsIllustration = ({ className = "w-16 h-16 sm:w-20 sm:h-20" }) => (
  <img 
    src="/images/coins_kpi.png" 
    alt="Total Earnings" 
    className={`${className} object-contain pointer-events-none select-none filter drop-shadow-xs`} 
  />
);
