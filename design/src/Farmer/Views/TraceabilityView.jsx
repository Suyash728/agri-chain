import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sprout, 
  Wheat, 
  Factory, 
  Truck, 
  Store, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ShoppingBag,
  Inbox
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import { getBatchQRCodeImageUrl, getBatchConsumerPassportUrl } from '../../utils/qrHelper';

export const TraceabilityView = ({ onBack, onOpenFullJourney, onViewJourney }) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all registered batches
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`${API_BASE_URL}/batches`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch batches');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setBatches(data);
          setSelectedBatchId(data[0].batch_id);
        } else {
          setBatches([]);
          setSelectedBatchId(null);
          setBatchData(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBatches([]);
          setSelectedBatchId(null);
          setBatchData(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch detailed traceability whenever selectedBatchId changes
  useEffect(() => {
    if (!selectedBatchId) {
      setBatchData(null);
      return;
    }

    let isMounted = true;
    fetch(`${API_BASE_URL}/batches/${selectedBatchId}/traceability`)
      .then((res) => {
        if (!res.ok) throw new Error('Traceability data not found');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setBatchData(data);
      })
      .catch(() => {
        if (isMounted) setBatchData(null);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatchId]);

  // Compute dynamic stage statuses based on the batch's actual on-chain state
  const getStageStatus = (currentState) => {
    const state = currentState || 'REGISTERED';

    if (state === 'SOLD') {
      return [
        { label: 'Farm', status: 'Completed', type: 'completed', icon: Sprout },
        { label: 'Harvest', status: 'Completed', type: 'completed', icon: Wheat },
        { label: 'Order', status: 'Completed', type: 'completed', icon: CheckCircle2 },
        { label: 'Transport', status: 'Completed', type: 'completed', icon: Truck },
        { label: 'Delivered', status: 'Sold & Delivered', type: 'completed', icon: ShoppingBag },
      ];
    }

    if (state === 'AT_RETAIL') {
      return [
        { label: 'Farm', status: 'Completed', type: 'completed', icon: Sprout },
        { label: 'Harvest', status: 'Completed', type: 'completed', icon: Wheat },
        { label: 'Order', status: 'Completed', type: 'completed', icon: CheckCircle2 },
        { label: 'Transport', status: 'Delivered', type: 'completed', icon: Truck },
        { label: 'Store', status: 'At Retail', type: 'active', icon: Store },
      ];
    }

    if (state === 'IN_STORAGE') {
      return [
        { label: 'Farm', status: 'Completed', type: 'completed', icon: Sprout },
        { label: 'Harvest', status: 'Completed', type: 'completed', icon: Wheat },
        { label: 'Order', status: 'Completed', type: 'completed', icon: CheckCircle2 },
        { label: 'Transport', status: 'Delivered', type: 'completed', icon: Truck },
        { label: 'Store', status: 'In Storage (GRN)', type: 'active', icon: Store },
      ];
    }

    if (state === 'IN_TRANSIT') {
      return [
        { label: 'Farm', status: 'Completed', type: 'completed', icon: Sprout },
        { label: 'Harvest', status: 'Completed', type: 'completed', icon: Wheat },
        { label: 'Order', status: 'Dispatched', type: 'completed', icon: CheckCircle2 },
        { label: 'Transport', status: 'In Transit', type: 'active', icon: Truck },
        { label: 'Store', status: 'Inbound Pending', type: 'pending', icon: Store },
      ];
    }

    if (state === 'CONFIRMED' || state === 'READY_FOR_PICKUP') {
      return [
        { label: 'Farm', status: 'Completed', type: 'completed', icon: Sprout },
        { label: 'Harvest', status: 'Completed', type: 'completed', icon: Wheat },
        { label: 'Order', status: 'Order Confirmed', type: 'active', icon: CheckCircle2 },
        { label: 'Transport', status: 'Pickup Scheduled', type: 'pending', icon: Truck },
        { label: 'Store', status: 'Pending', type: 'pending', icon: Store },
      ];
    }

    // Default: REGISTERED
    return [
      { label: 'Farm', status: 'Completed', type: 'completed', icon: Sprout },
      { label: 'Harvest', status: 'Completed', type: 'completed', icon: Wheat },
      { label: 'Order', status: 'Awaiting Pickup', type: 'pending', icon: CheckCircle2 },
      { label: 'Transport', status: 'Pending', type: 'pending', icon: Truck },
      { label: 'Store', status: 'Pending', type: 'pending', icon: Store },
    ];
  };

  const stages = getStageStatus(batchData?.currentState);

  const handleOpenJourney = () => {
    const targetId = selectedBatchId || batchData?.batchId;
    if (onOpenFullJourney) {
      onOpenFullJourney(targetId);
    } else if (onViewJourney) {
      onViewJourney(targetId);
    }
  };

  return (
    <div className="bg-white border border-[#E6E1D5] rounded-2xl p-4 sm:p-6 shadow-xs max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#3B3028]" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#3B3028] tracking-tight">
              Traceability
            </h1>
            <p className="text-xs sm:text-sm text-[#786E65] font-medium">
              Track your produce from farm to fork with immutable on-chain logs
            </p>
          </div>
        </div>

        {batchData?.qualityGrade && (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shadow-2xs">
            Grade {batchData.qualityGrade}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#666057]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#556B2F]" />
          <span className="text-xs font-bold">Querying on-chain batch registries...</span>
        </div>
      ) : batches.length === 0 ? (
        /* Empty State */
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center my-4">
          <div className="w-14 h-14 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#786E65] mb-3">
            <Inbox className="w-7 h-7 text-[#786E65]" />
          </div>
          <h3 className="text-base font-bold text-[#3B3028]">No Registered Batches</h3>
          <p className="text-xs text-[#786E65] mt-1 max-w-sm leading-relaxed">
            There are currently no produce batches registered in your farm inventory. Add new harvest lots in the My Crops / Add Stock view to track live cold-chain provenance.
          </p>
        </div>
      ) : (
        <>
          {/* Dynamic Batch Switcher */}
          {batches.length > 1 && (
            <div className="mt-4 mb-5 p-2 bg-[#FAF7F0] rounded-xl border border-[#E8E2D5] flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-[#786E65] whitespace-nowrap pl-1">Batch:</span>
              <div className="flex items-center gap-1.5 flex-nowrap">
                {batches.map((b) => (
                  <button
                    key={b.batch_id}
                    onClick={() => setSelectedBatchId(b.batch_id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedBatchId === b.batch_id
                        ? 'bg-[#3D4E2A] text-white shadow-xs'
                        : 'bg-white text-[#3B3028] border border-[#E6E1D5] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    {b.crop_name} (#{b.batch_id.slice(-6)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Horizontal Stepper Diagram */}
          <div className="mt-4 mb-6 px-1">
            <div className="flex items-center justify-between relative">
              {stages.map((stage, sIdx) => {
                const IconComponent = stage.icon;
                const isCompleted = stage.type === 'completed';
                const isActive = stage.type === 'active';

                const circleClass = isCompleted
                  ? 'bg-[#E8EEDF] text-[#3D4E2A]'
                  : isActive
                  ? 'bg-[#FDEEE3] border border-[#F5C29B] text-[#C86428] ring-2 ring-[#C86428]/20'
                  : 'bg-[#F5F2EB] text-[#786E65] opacity-75';

                const statusColor = isCompleted
                  ? 'text-[#556B2F]'
                  : isActive
                  ? 'text-[#C86428]'
                  : 'text-[#786E65]';

                const arrowColor = isCompleted
                  ? 'text-[#556B2F]'
                  : isActive
                  ? 'text-[#C86428]'
                  : 'text-[#D0C9BD]';

                return (
                  <React.Fragment key={stage.label}>
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1.5 shadow-2xs ${circleClass}`}>
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-[#3B3028]">{stage.label}</span>
                      <span className={`text-[10px] sm:text-[11px] font-bold mt-0.5 whitespace-nowrap ${statusColor}`}>
                        {stage.status}
                      </span>
                    </div>

                    {sIdx < stages.length - 1 && (
                      <ArrowRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 -mt-5 ${arrowColor}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Dynamic Batch Info Card */}
          {batchData && (
            <div 
              style={{ backgroundColor: '#FAF7F0' }}
              className="rounded-2xl p-4 sm:p-5 border border-[#E8E2D5] flex flex-col gap-2.5 text-xs sm:text-sm mb-6"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#786E65]">Product</span>
                <span className="font-extrabold text-[#3B3028] text-sm">{batchData.product}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#786E65]">Batch ID</span>
                <span className="font-mono font-extrabold text-[#3B3028] bg-white px-2 py-0.5 rounded-md border border-[#E8E2D5] text-xs">
                  {batchData.batchId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#786E65]">Quantity</span>
                <span className="font-bold text-[#3B3028]">{batchData.quantity || '500 kg'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#786E65]">Current Location</span>
                <span className="font-extrabold text-[#2A371B] text-right max-w-[280px] truncate" title={batchData.currentLocation}>
                  {batchData.currentLocation}
                </span>
              </div>
              {batchData.currentHolder && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#786E65]">Current Custodian</span>
                  <span className="font-bold text-[#3D4E2A]">{batchData.currentHolder}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#786E65]">Origin Farm</span>
                <span className="font-medium text-[#3B3028]">{batchData.farmDetails?.split(',')[0] || 'Farm Lot'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#E8E2D5]">
                <span className="font-bold text-[#786E65]">AI Quality & Freshness</span>
                <span className="font-black text-emerald-700 flex items-center gap-1">
                  <span>{batchData.qualityScore || 98}%</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded font-bold">
                    Grade {batchData.qualityGrade || 'A+'}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E8E2D5]">
                <div className="flex flex-col">
                  <span className="font-bold text-[#786E65]">On-Chain QR Passport</span>
                  <span className="text-[11px] text-[#556B2F] font-semibold">Physical produce packaging label</span>
                </div>
                <a
                  href={getBatchConsumerPassportUrl(batchData.batchId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Scan with phone camera or click to open URL directly"
                  className="w-13 h-13 bg-white p-0.5 rounded-xl border border-[#E8E2D5] flex items-center justify-center shadow-2xs flex-shrink-0 cursor-pointer hover:border-[#3D4E2A] transition-colors"
                >
                  <img
                    src={getBatchQRCodeImageUrl(batchData.batchId, 90)}
                    alt={`QR #${batchData.batchId}`}
                    className="w-12 h-12 object-contain"
                  />
                </a>
              </div>
            </div>
          )}

          {/* View Full Journey Action Button */}
          <button 
            onClick={handleOpenJourney}
            className="w-full py-3.5 bg-[#3D4E2A] hover:bg-[#2A371B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>View Full Journey</span>
          </button>
        </>
      )}
    </div>
  );
};
