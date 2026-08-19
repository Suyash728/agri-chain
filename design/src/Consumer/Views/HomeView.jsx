import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { consumerCategories, consumerProducts } from '../data/consumerData';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export const HomeView = ({ 
  onNavigate, 
  onAddToCart, 
  onProductClick 
}) => {
  const bestSellers = consumerProducts.filter(p => p.isBestSeller);
  const activeCategories = consumerCategories.filter(c => c.id !== 'dairy').slice(0, 6);

  const productSections = [
    { id: 'fruits', name: 'Fruits' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'grains', name: 'Grains' },
    { id: 'pulses', name: 'Pulses & Legumes' },
    { id: 'spices', name: 'Spices' },
    { id: 'dryfruits', name: 'Dry Fruits & Nuts' }
  ];

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-12 pt-3">
      <div className="px-4 md:px-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* 1. Hero Banner */}
        <div className="relative rounded-[18px] border border-[#E6E1D5] shadow-xs overflow-hidden h-[280px] w-full flex flex-col justify-between">
          {/* Background Image Artwork (Clean artwork, zero text/badges) */}
          <img 
            src="/images/hero_straight_walnut_crate.jpg" 
            alt="Farm Fresh Countryside Landscape with Dark Walnut Produce Crate" 
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />


          {/* Single Trust Badge (Bottom Right over crate) */}
          <div className="absolute right-6 bottom-5 z-10 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-full border border-[#E6E1D5] shadow-sm flex items-center gap-2 text-xs font-extrabold text-[#354424]">
            <ShieldCheck className="w-4 h-4 text-[#354424]" />
            <div className="leading-none text-left">
              <span className="block font-black text-xs text-[#354424]">100%</span>
              <span className="text-[10px] text-[#666057]">Natural & Safe</span>
            </div>
          </div>

          {/* Single Hero Banner Text Content Layer */}
          <div className="relative z-10 pt-[38px] pl-[38px] max-w-[420px] flex flex-col">
            <h3 className="text-2xl font-black text-[#29452A] leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(255,253,242,0.6)] mb-2.5">
              Farm Fresh, <br />Delivered With Trust
            </h3>
            <p className="text-[13px] font-medium text-white leading-snug drop-shadow-[0_1px_3px_rgba(30,55,25,0.35)]">
              Handpicked produce from trusted farmers, delivered fresh to your doorstep.
            </p>
            <button 
              onClick={() => onNavigate('products')}
              className="mt-[18px] self-start px-4 py-2 rounded-full bg-[#354424] text-white font-extrabold text-xs flex items-center gap-2 shadow-sm hover:bg-[#2D3B1E] active:scale-95 transition-all cursor-pointer"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 2. Shop by Categories Section */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm sm:text-lg text-[#2D2620]">Shop by Categories</h3>
            <button 
              onClick={() => onNavigate('categories')}
              className="text-xs sm:text-sm font-extrabold text-[#354424] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* 6 Category Cards Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-4">
            {activeCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('products', cat.id)}
                className="bg-white rounded-2xl p-2.5 sm:p-4 border border-[#E6E1D5] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#354424] hover:shadow-sm transition-all group"
              >
                <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-xl bg-[#FAF7F0] flex items-center justify-center p-1 sm:p-2 mb-1.5 group-hover:scale-105 transition-transform">
                  <img src={cat.image} alt={cat.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                </div>
                <span className="text-[10px] sm:text-xs font-extrabold text-[#2D2620] leading-tight line-clamp-1">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Best Sellers Section */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm sm:text-lg text-[#2D2620]">Best Sellers</h3>
            <button 
              onClick={() => onNavigate('products')}
              className="text-xs sm:text-sm font-extrabold text-[#354424] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {bestSellers.slice(0, 6).map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        </div>

        {/* 4 - 9. Category-Wise Product Sections (Exactly 2 Product Cards per Category) */}
        {productSections.map((sec) => {
          const secProducts = consumerProducts.filter(p => p.category === sec.id);
          if (secProducts.length === 0) return null;

          return (
            <div key={sec.id} className="flex flex-col gap-3 border-t border-[#E6E1D5]/60 pt-5">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm sm:text-lg text-[#2D2620] flex items-center gap-2">
                  <span>{sec.name}</span>
                </h3>
                <button 
                  onClick={() => onNavigate && onNavigate('products', sec.id)}
                  className="text-xs sm:text-sm font-extrabold text-[#354424] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View All →</span>
                </button>
              </div>

              {/* Exactly 2 Product Cards Preview Row */}
              <div className="flex overflow-x-auto no-scrollbar gap-3 sm:gap-4 pb-2 pt-1">
                {secProducts.slice(0, 2).map((product) => (
                  <div key={product.id} className="w-[140px] sm:w-[175px] flex-shrink-0">
                    <ProductCard 
                      product={product}
                      onAddToCart={onAddToCart}
                      onProductClick={onProductClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};
