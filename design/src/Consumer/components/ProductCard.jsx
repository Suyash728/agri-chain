import React from 'react';
import { Plus, Star, Heart } from 'lucide-react';

export const ProductCard = ({ product, onAddToCart, onProductClick, onToggleFavorite }) => {
  return (
    <div 
      className="bg-white rounded-2xl p-3 border border-[#E6E1D5] shadow-xs flex flex-col justify-between relative group hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onProductClick && onProductClick(product)}
    >
      {/* Favorite Heart Button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs border border-[#E6E1D5] flex items-center justify-center text-red-500 hover:scale-110 transition-transform cursor-pointer"
        >
          <Heart className={`w-3.5 h-3.5 ${product.isFavorite ? 'fill-red-500 text-red-500' : 'text-[#666057]'}`} />
        </button>
      )}

      {/* Product Image - Off-white background preserved, inner square box removed */}
      <div className="w-full h-28 bg-[#F8F5EE] rounded-xl p-2.5 flex items-center justify-center overflow-hidden mb-2.5">
        <img 
          src={product.image} 
          alt={product.name} 
          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" 
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-0.5">
        <h4 className="font-extrabold text-xs text-[#2D2620] leading-tight line-clamp-1">
          {product.name}
        </h4>
        <span className="text-[11px] font-semibold text-[#666057]">
          {product.weight}
        </span>

        {/* Rating & Price Row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-[#2D2620]">₹ {product.price}</span>
            <div className="flex items-center gap-0.5 text-[10px] text-[#666057] ml-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* Green Plus Add Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart && onAddToCart(product);
            }}
            className="w-7 h-7 rounded-full bg-[#354424] text-white flex items-center justify-center shadow-xs hover:bg-[#2D3B1E] active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
