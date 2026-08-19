import React from 'react';
import { Trash2, Plus, Minus, Tag, ChevronRight } from 'lucide-react';

export const CartView = ({ 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  onApplyCouponClick,
  appliedCoupon,
  onNavigate 
}) => {
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = appliedCoupon ? Math.round(subtotal * 0.2) : 0;
  const deliveryCharges = subtotal > 0 ? 20 : 0;
  const grandTotal = Math.max(0, subtotal - discount + deliveryCharges);

  return (
    <div className="flex flex-col gap-3 pb-24 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        <h2 className="text-lg md:text-xl font-black text-[#2D2620]">Shopping Cart</h2>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-[#E6E1D5] flex flex-col items-center justify-center text-center max-w-md mx-auto my-8">
            <span className="text-4xl mb-3">🛒</span>
            <h4 className="font-extrabold text-base text-[#2D2620]">Your cart is empty</h4>
            <p className="text-xs text-[#666057] mt-1 mb-4">Add farm fresh produce to get started</p>
            <button 
              onClick={() => onNavigate && onNavigate('products')}
              className="px-6 py-2.5 rounded-full bg-[#354424] text-white text-xs font-extrabold shadow-md hover:bg-[#2D3B1E]"
            >
              Browse Products
            </button>
          </div>
        ) : (
          /* Responsive 2-Column Grid on Desktop */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Cart Items List */}
            <div className="md:col-span-2 flex flex-col gap-3">
              {cartItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex items-center justify-between gap-4"
                >
                  {/* Product Image - Off-white background preserved, inner square box removed */}
                  <div className="w-16 h-16 rounded-xl bg-[#F8F5EE] p-1.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col gap-0.5">
                    <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620] leading-tight">
                      {item.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-[#666057]">
                      {item.weight}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#2D2620]">
                      ₹ {item.price * item.quantity}
                    </span>
                  </div>

                  {/* Quantity Control Pill + Trash */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-full px-3 py-1.5">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[#2D2620] hover:bg-white cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-extrabold text-[#2D2620] min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[#2D2620] hover:bg-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="text-[#666057] hover:text-red-500 transition-colors p-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right 1 Col: Order Summary & Coupon Sidebar */}
            <div className="md:col-span-1 flex flex-col gap-4 sticky top-20">
              {/* Apply Coupon Button Pill */}
              <div 
                onClick={onApplyCouponClick}
                className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex justify-between items-center cursor-pointer hover:border-[#354424] transition-all"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#2D2620]">
                  <Tag className="w-4 h-4 text-[#354424]" />
                  <span>{appliedCoupon ? `Coupon Applied (${appliedCoupon})` : 'Apply Coupon'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#666057]" />
              </div>

              {/* Price Breakdown Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-3">
                <h3 className="font-extrabold text-sm text-[#2D2620] pb-2 border-b border-[#F4F5E6]">
                  Order Summary
                </h3>

                <div className="flex justify-between items-center text-xs font-semibold text-[#666057]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#2D2620]">₹ {subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-600">
                    <span>Coupon Discount (20%)</span>
                    <span className="font-bold">- ₹ {discount}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-semibold text-[#666057]">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-[#2D2620]">₹ {deliveryCharges}</span>
                </div>

                <div className="h-px bg-[#E6E1D5] my-1" />

                <div className="flex justify-between items-center text-sm font-extrabold text-[#2D2620]">
                  <span>Total Amount</span>
                  <span className="text-lg text-[#354424] font-black">₹ {grandTotal}</span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={onCheckout}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-[#354424] text-white font-extrabold text-sm shadow-md hover:bg-[#2D3B1E] active:scale-[0.99] transition-all cursor-pointer text-center"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
