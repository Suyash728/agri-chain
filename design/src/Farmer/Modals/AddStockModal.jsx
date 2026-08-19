import React, { useState } from 'react';
import { X, Plus, Sprout, CheckCircle2 } from 'lucide-react';

export const AddStockModal = ({ isOpen, onClose, onAddStock }) => {
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('Grains');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cropName || !quantity || !price) return;

    setSuccessMsg(true);
    setTimeout(() => {
      onAddStock({
        id: `inv-${Date.now()}`,
        name: cropName,
        category: category,
        quantity: `${quantity} Tonnes`,
        rawKg: parseFloat(quantity) * 1000,
        value: `₹ ${price}`,
        status: "In Stock"
      });
      setSuccessMsg(false);
      setCropName('');
      setQuantity('');
      setPrice('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-[#3D4E2A]" />
            <h3 className="text-base font-extrabold text-[#3B3028]">Add New Stock Batch</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#786E65] hover:text-[#3B3028]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {successMsg ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#E3EBD3] text-[#3D5220] flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#3B3028]">Stock Added Successfully!</h4>
              <p className="text-xs text-[#786E65]">Batch hash registered on AgriChain AI layer.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-[#3B3028] block mb-1">Crop Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Alphonso Mango, Sharbati Wheat"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3D4E2A]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3B3028] block mb-1">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3D4E2A]"
                >
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Grains">Grains</option>
                  <option value="Pulses">Pulses & Legumes</option>
                  <option value="Spices">Spices</option>
                  <option value="DryFruits">Dry Fruits & Nuts</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3B3028] block mb-1">Quantity (Tonnes)</label>
                  <input 
                    type="number"
                    step="0.05"
                    placeholder="e.g. 0.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3D4E2A]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3B3028] block mb-1">Total Value (₹)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 5000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3D4E2A]"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2"
              >
                <Plus className="w-5 h-5 text-white" />
                <span>Submit & Verify Batch</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
