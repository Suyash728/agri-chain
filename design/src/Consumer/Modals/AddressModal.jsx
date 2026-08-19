import React from 'react';
import { X, MapPin, Check } from 'lucide-react';

export const AddressModal = ({ isOpen, onClose, currentAddress, onSelectAddress }) => {
  if (!isOpen) return null;

  const addresses = [
    { id: 'a1', city: 'Nashik, Maharashtra', area: 'Central Store Zone, College Road, Nashik - 422005' },
    { id: 'a2', city: 'Pune, Maharashtra', area: 'Kothrud Farm Hub, Karve Road, Pune - 411038' },
    { id: 'a3', city: 'Mumbai, Maharashtra', area: 'Bandra West Fresh Express, Mumbai - 400050' },
    { id: 'a4', city: 'Satara, Maharashtra', area: 'Satara Farmer Collective, Satara - 415001' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm sm:max-w-md p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#354424]" />
            <span>Select Delivery Location</span>
          </h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {addresses.map((addr) => {
            const isSelected = currentAddress.includes(addr.city.split(',')[0]);
            return (
              <div
                key={addr.id}
                onClick={() => {
                  onSelectAddress(addr.city);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-[#EBF3E8] border-[#354424] shadow-xs' 
                    : 'bg-white border-[#E6E1D5] hover:border-[#354424]'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-extrabold text-[#2D2620]">{addr.city}</span>
                  <span className="text-[11px] font-medium text-[#666057]">{addr.area}</span>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#354424] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
