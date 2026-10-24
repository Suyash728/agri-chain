import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const OrderSuccessModal = ({ isOpen, onClose, onViewOrders }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm p-6 border border-[#E6E1D5] shadow-2xl flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#EBF3E8] text-[#354424] flex items-center justify-center border border-[#C2E0B8]">
          <CheckCircle2 className="w-10 h-10 text-[#354424]" />
        </div>

        <h3 className="text-lg font-black text-[#2D2620]">Order Placed Successfully!</h3>
        <p className="text-xs font-semibold text-[#666057]">
          Order <span className="font-extrabold text-[#2D2620]">#ORD1257</span> confirmed. Fresh produce is being packed at Nashik Central Dark Store.
        </p>

        <div className="w-full bg-white p-3 rounded-2xl border border-[#E6E1D5] text-left flex justify-between items-center text-xs font-bold text-[#2D2620]">
          <span>Estimated Delivery</span>
          <span className="text-[#354424]">Today by 4:00 PM</span>
        </div>

        <button
          onClick={() => {
            onClose();
            onViewOrders();
          }}
          className="w-full py-3 rounded-2xl bg-[#354424] text-white text-xs font-extrabold shadow-md hover:bg-[#2D3B1E] flex items-center justify-center gap-1.5 cursor-pointer mt-1"
        >
          <span>View My Orders</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};
