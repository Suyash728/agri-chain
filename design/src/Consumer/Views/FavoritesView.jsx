import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { consumerProducts } from '../data/consumerData';

export const FavoritesView = ({ onAddToCart, onToggleFavorite, onProductClick }) => {
  const favoriteItems = consumerProducts.filter(p => p.isFavorite);

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        {favoriteItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-[#E6E1D5] text-center flex flex-col items-center max-w-md mx-auto my-8">
            <Heart className="w-10 h-10 text-[#666057] mb-3" />
            <h4 className="font-extrabold text-base text-[#2D2620]">No favorites added yet</h4>
            <p className="text-xs text-[#666057] mt-1">Tap the heart icon on any product to save it here</p>
          </div>
        ) : (
          /* Mobile 1-col, Desktop 4-col Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoriteItems.map((product) => (
              <div
                key={product.id}
                onClick={() => onProductClick && onProductClick(product)}
                className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex md:flex-col items-center md:items-stretch justify-between gap-3 cursor-pointer hover:border-[#354424] hover:shadow-md transition-all"
              >
                {/* Product Image - Off-white background preserved, inner square box removed */}
                <div className="w-20 md:w-full h-20 md:h-32 bg-[#F8F5EE] rounded-xl p-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                </div>

                {/* Title & Weight */}
                <div className="flex-1 flex flex-col gap-0.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620] leading-tight">
                    {product.name}
                  </h4>
                  <span className="text-[11px] font-semibold text-[#666057]">
                    {product.weight}
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs sm:text-sm font-extrabold text-[#2D2620]">
                      ₹ {product.price}
                    </span>

                    {/* Action Buttons: Red Heart + Plus */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite && onToggleFavorite(product.id);
                        }}
                        className="w-8 h-8 rounded-full bg-[#FFF0F0] text-red-500 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart && onAddToCart(product);
                        }}
                        className="w-8 h-8 rounded-full bg-[#354424] text-white flex items-center justify-center shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
