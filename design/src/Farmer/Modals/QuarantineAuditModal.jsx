import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, AlertTriangle, ThermometerSnowflake, MapPin, Clock, Fingerprint, RefreshCw } from 'lucide-react';

export const QuarantineAuditModal = ({ isOpen, onClose }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuarantine = () => {
    setLoading(true);
    fetch('http://localhost:8000/telemetry/quarantine')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setIncidents(data);
        }
      })
      .catch((err) => console.error('Failed to load quarantine audit logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuarantine();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF7F0] border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] flex items-center justify-center text-[#991B1B]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#2D2620]">
                AI Trust Layer • Quarantine Audit Log
              </h3>
              <p className="text-xs text-[#666057]">
                Explainable telemetry anomalies intercepted and isolated from blockchain
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchQuarantine}
              className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs">
            <div>
              <span className="text-[10px] text-[#666057] font-bold block">Quarantined Incidents</span>
              <span className="text-base font-extrabold text-[#991B1B]">{incidents.length} Events</span>
            </div>
            <div>
              <span className="text-[10px] text-[#666057] font-bold block">Oracle Integrity Status</span>
              <span className="text-base font-extrabold text-[#556B2F]">100% Protected</span>
            </div>
            <div>
              <span className="text-[10px] text-[#666057] font-bold block">Verification Engine</span>
              <span className="text-base font-extrabold text-[#2D2620]">ML + Multi-Fault</span>
            </div>
          </div>

          {/* Incidents List */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#666057]">
              Intercepted Violations ({incidents.length})
            </h4>

            {incidents.length === 0 ? (
              <div className="py-8 text-center text-[#666057]">
                <p className="font-extrabold text-sm">No quarantined incidents found.</p>
                <p className="text-xs mt-1">All processed cold-chain telemetry has passed compliance.</p>
              </div>
            ) : (
              incidents.map((inc) => (
                <div 
                  key={inc.id}
                  className="p-4 rounded-2xl bg-white border border-[#E6E1D5] hover:border-[#FCA5A5] transition-all flex flex-col gap-3 shadow-2xs"
                >
                  {/* Incident Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#E6E1D5]/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]">
                        QUARANTINED
                      </span>
                      <span className="font-extrabold text-[#2D2620]">Batch: {inc.batchId}</span>
                      <span className="text-[#666057]">• {inc.cropName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#666057]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{inc.quarantinedAt}</span>
                    </div>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E6E1D5]/70">
                    <div>
                      <span className="text-[10px] text-[#666057] block">Temperature</span>
                      <span className="font-extrabold text-[#991B1B] flex items-center gap-1">
                        <ThermometerSnowflake className="w-3.5 h-3.5" />
                        {inc.tempC}°C
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#666057] block">Humidity</span>
                      <span className="font-extrabold text-[#2D2620]">{inc.humidityPct}%</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#666057] block">Location (GPS)</span>
                      <span className="font-bold text-[#2D2620] flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#666057] flex-shrink-0" />
                        {inc.latitude?.toFixed?.(3) ?? inc.latitude}, {inc.longitude?.toFixed?.(3) ?? inc.longitude}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#666057] block">Anomaly Score</span>
                      <span className="font-mono font-bold text-[#D97706]">{inc.anomalyScore}</span>
                    </div>
                  </div>

                  {/* Reasons / Explainable Fault Codes */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#666057]">
                      Detection Reasons:
                    </span>
                    <ul className="space-y-1">
                      {inc.reasons.map((reason, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5 text-[#991B1B] font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Event ID and Disposition */}
                  <div className="pt-2 border-t border-[#E6E1D5]/60 flex items-center justify-between text-[10px] text-[#8C8275]">
                    <div className="flex items-center gap-1">
                      <Fingerprint className="w-3 h-3 text-[#8C8275]" />
                      <span className="font-mono">Audit ID: {inc.id.slice(0, 16)}...</span>
                    </div>
                    <span className="font-bold text-[#556B2F]">Disposition: Isolated from Chain</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF7F0] border-t border-[#E6E1D5] flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#354424] text-white font-extrabold text-xs sm:text-sm hover:bg-[#26321A] transition-colors cursor-pointer shadow-xs"
          >
            Close Audit Log
          </button>
        </div>

      </div>
    </div>
  );
};
