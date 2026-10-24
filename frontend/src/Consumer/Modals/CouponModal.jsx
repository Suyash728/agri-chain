import React, { useState } from 'react';
import { X, Tag, Check } from 'lucide-react';

export const CouponModal = ({ isOpen, onClose, onApplyCoupon }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApply = (couponCode) => {
    const targetCode = couponCode || code;
    if (!targetCode.trim()) {
      setError('Please enter a valid coupon code');
      return;
    }
    onApplyCoupon(targetCode.toUpperCase());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-[#354424]" />
            <span>Apply Coupon</span>
          </h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter promo code (e.g. FRESH20)"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            className="flex-1 uppercase bg-white border border-[#E6E1D5] rounded-xl px-3 py-2 text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
          />
          <button
            onClick={() => handleApply()}
            className="px-4 py-2 bg-[#354424] text-white rounded-xl text-xs font-extrabold shadow-xs hover:bg-[#2D3B1E]"
          >
            Apply
          </button>
        </div>

        {error && <span className="text-[11px] font-bold text-red-500">{error}</span>}

        {/* Preset Available Coupons */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#666057]">Available Offers</span>
          
          <div 
            onClick={() => handleApply('FRESH20')}
            className="bg-white p-3 rounded-2xl border border-[#E6E1D5] flex justify-between items-center cursor-pointer hover:border-[#354424]"
          >
            <div>
              <span className="text-xs font-black text-[#354424] block">FRESH20</span>
              <span className="text-[10px] text-[#666057]">Get 20% OFF on fresh farm produce</span>
            </div>
            <span className="text-xs font-extrabold text-[#354424]">USE</span>
          </div>

          <div 
            onClick={() => handleApply('FARMER10')}
            className="bg-white p-3 rounded-2xl border border-[#E6E1D5] flex justify-between items-center cursor-pointer hover:border-[#354424]"
          >
            <div>
              <span className="text-xs font-black text-[#354424] block">FARMER10</span>
              <span className="text-[10px] text-[#666057]">Flat ₹10 discount on first order</span>
            </div>
            <span className="text-xs font-extrabold text-[#354424]">USE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
