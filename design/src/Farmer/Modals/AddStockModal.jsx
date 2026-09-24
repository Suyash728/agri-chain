import React, { useState } from 'react';
import { X, Plus, Sprout, CheckCircle2, Wallet } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../components/WalletConnect';
import { CONTRACT_ADDRESSES, PRODUCT_REGISTRY_ABI, CUSTODY_TRANSFER_ABI, toBytes32 } from '../../utils/contracts';

export const AddStockModal = ({ isOpen, onClose, onAddStock }) => {
  const { account, signer } = useWallet();
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('Grains');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cropName || !quantity || !price) return;

    setLoading(true);
    setErrorMsg(null);

    const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
    let clientTxHash = null;

    // 1. If MetaMask connected, request user signature directly on-chain
    if (signer) {
      try {
        const registryContract = new ethers.Contract(
          CONTRACT_ADDRESSES.ProductRegistry,
          PRODUCT_REGISTRY_ABI,
          signer
        );
        const b32 = toBytes32(batchId);
        const harvestTimestamp = Math.floor(Date.now() / 1000);
        const tx = await registryContract.registerBatch(
          b32,
          cropName,
          'Nashik Organic Farm cluster 4',
          harvestTimestamp,
          account
        );
        const receipt = await tx.wait();
        clientTxHash = receipt.hash || tx.hash;

        // Initialize custody on CustodyTransfer contract directly from farmer
        try {
          const custodyContract = new ethers.Contract(
            CONTRACT_ADDRESSES.CustodyTransfer,
            CUSTODY_TRANSFER_ABI,
            signer
          );
          const initTx = await custodyContract.initializeCustody(b32, account);
          await initTx.wait();
        } catch (initErr) {
          console.log('Custody init on-chain note:', initErr);
        }
      } catch (walletErr) {
        console.warn('MetaMask signing rejected or failed, falling back to backend relayer:', walletErr);
      }
    }

    const payload = {
      batch_id: batchId,
      crop_name: cropName,
      origin_farm: 'Nashik Organic Farm cluster 4',
      harvest_date: new Date().toISOString().split('T')[0],
      farmer_name: 'Rahul Patil',
      farmer_address: account || undefined,
      category: category,
      quantity_tonnes: parseFloat(quantity) || 0.5,
      price_inr: parseFloat(price) || 2500,
    };

    try {
      const res = await fetch('http://localhost:8000/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to register batch on blockchain');
      }

      const registered = await res.json();
      const finalTxHash = clientTxHash || registered.tx_hash;

      setSuccessMsg(true);
      setTimeout(() => {
        if (onAddStock) {
          onAddStock({
            id: batchId,
            name: cropName,
            category: category,
            quantity: `${quantity} Tonnes`,
            rawKg: parseFloat(quantity) * 1000,
            value: `₹ ${Number(price).toLocaleString('en-IN')}`,
            status: "In Stock",
            tx_hash: finalTxHash
          });
        }
        setSuccessMsg(false);
        setCropName('');
        setQuantity('');
        setPrice('');
        setLoading(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error adding stock batch:', err);
      setErrorMsg(err.message);
      setLoading(false);
    }
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
              <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                account ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' : 'bg-[#FAF7F0] border-[#E6E1D5] text-[#666057]'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{account ? 'MetaMask Connected' : 'Relayer Signing Active'}</span>
                </div>
                <span className="font-mono text-[10px] font-extrabold">
                  {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)} (Direct on-chain)` : 'Automated backend fallback'}
                </span>
              </div>

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

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#3D4E2A] hover:bg-[#2A371B] disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-white" />
                <span>{loading ? 'Registering on Blockchain...' : 'Submit & Verify Batch'}</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
