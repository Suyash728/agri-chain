import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldCheck, 
  ShieldAlert, 
  ThermometerSnowflake, 
  Droplets, 
  MapPin, 
  Send, 
  RefreshCw, 
  Cpu, 
  Database, 
  Ban, 
  AlertTriangle 
} from 'lucide-react';
import { aiTrustData as initialData } from '../../data/mockData';
import { QuarantineAuditModal } from '../Modals/QuarantineAuditModal';

export const AITrustView = ({ onBack, onOpenDetails }) => {
  const [trustData, setTrustData] = useState(initialData);
  const [isQuarantineOpen, setIsQuarantineOpen] = useState(false);

  // Live Telemetry Input State
  const [batchId, setBatchId] = useState('BATCH-PO-2026-001');
  const [cropName, setCropName] = useState('tomato');
  const [temperature, setTemperature] = useState(4.5);
  const [humidity, setHumidity] = useState(88.0);
  const [latitude, setLatitude] = useState(18.5204);
  const [longitude, setLongitude] = useState(73.8567);

  // Transmission & Result State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [evalError, setEvalError] = useState(null);

  const handleOpenDetails = () => {
    if (onOpenDetails) onOpenDetails();
    setIsQuarantineOpen(true);
  };

  useEffect(() => {
    fetch('http://localhost:8000/farmer/ai-trust')
      .then((res) => res.json())
      .then((json) => {
        if (json && json.score !== undefined) {
          setTrustData(json);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch live AI trust data, using fallback:', err);
      });
  }, []);

  const handleApplyPreset = (type) => {
    if (type === 'safe') {
      setTemperature(4.5);
      setHumidity(88.0);
      setCropName('tomato');
    } else if (type === 'thermal_breach') {
      setTemperature(48.0);
      setHumidity(32.0);
      setCropName('tomato');
    } else if (type === 'rate_spike') {
      setTemperature(26.5);
      setHumidity(55.0);
      setCropName('tomato');
    }
  };

  const handleSendTelemetry = async () => {
    setIsEvaluating(true);
    setEvalError(null);
    setEvalResult(null);

    const payload = {
      batch_id: batchId,
      crop_name: cropName,
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };

    try {
      const res = await fetch('http://localhost:8000/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned error ${res.status}`);
      }

      const data = await res.json();
      setEvalResult(data);
    } catch (err) {
      console.error('Failed to submit telemetry:', err);
      setEvalError(err.message || 'Network error occurred while contacting AI Trust Layer.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="bg-white border border-[#E6E1D5] rounded-3xl p-4 sm:p-6 flex flex-col gap-6 shadow-xs max-w-3xl mx-auto w-full">
      {/* Top Row: Back Arrow + AI Trust Score Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors flex-shrink-0 border border-[#E6E1D5] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#3B3028] tracking-tight">
              AI Trust & Blockchain Verification
            </h1>
            <p className="text-xs text-[#786E65] font-medium">
              Live IoT Telemetry Gatekeeper & Smart Contract Ledger
            </p>
          </div>
        </div>

        <button 
          onClick={handleOpenDetails}
          className="text-xs font-bold text-[#3B3028] hover:text-[#556B2F] transition-colors py-1.5 px-3.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] cursor-pointer flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#991B1B]" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Main Score Row */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5]">
        {/* Left: Shield Icon + Large Score */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#2E3A1F] flex items-center justify-center shadow-xs flex-shrink-0">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8c-2 2-3 4-3 6a3 3 0 0 0 6 0c0-2-1-4-3-6z" fill="currentColor" opacity="0.4" />
            </svg>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2E3A1F]">
                {trustData.score}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#3B3028]">
                /{trustData.maxScore}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#3D5220] ml-1.5 whitespace-nowrap">
                {trustData.level}
              </span>
            </div>

            <p className="text-xs text-[#786E65] font-semibold mt-0.5 leading-tight">
              IoT Sensor Integrity verified across multi-fault ML pipeline.
            </p>
          </div>
        </div>

        {/* Right: Smooth Upward-Trending Line Chart */}
        <div className="w-28 sm:w-36 h-12 relative flex items-end justify-end pointer-events-none flex-shrink-0">
          <svg viewBox="0 0 120 50" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="aiGraphBlendGradFinal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#556B2F" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#556B2F" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path 
              d="M 5 42 C 30 38, 55 28, 80 18 T 115 8 L 115 48 L 5 48 Z" 
              fill="url(#aiGraphBlendGradFinal)" 
            />
            <path 
              d="M 5 42 C 30 38, 55 28, 80 18 T 115 8" 
              fill="none" 
              stroke="#556B2F" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <circle cx="5" cy="42" r="3" fill="#556B2F" />
            <circle cx="42" cy="33" r="3" fill="#556B2F" />
            <circle cx="80" cy="18" r="3" fill="#556B2F" />
            <circle cx="115" cy="8" r="4.5" fill="#2E3A1F" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FACULTY REVIEW DEMO SANDBOX: MANUAL INPUT & LIVE EVAL     */}
      {/* ======================================================== */}
      <div className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6E1D5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2E3A1F] text-white">
                FACULTY REVIEW DEMO
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-[#2D2620]">
                Live IoT Telemetry & Blockchain Sandbox
              </h2>
            </div>
            <p className="text-xs text-[#666057] mt-0.5">
              Enter telemetry values manually to demonstrate AI gatekeeper & on-chain anchoring in real time.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplyPreset('safe')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer"
            >
              🟢 Safe (4.5°C)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('thermal_breach')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 transition-colors cursor-pointer"
            >
              🔴 Spike (48.0°C)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('rate_spike')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              ⚡ Jump (26.5°C)
            </button>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Batch ID */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#3B3028]">Batch ID</label>
            <input 
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="e.g. BATCH-PO-2026-001"
              className="px-3 py-2 bg-white border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620] focus:outline-none focus:border-[#556B2F]"
            />
          </div>

          {/* Crop Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#3B3028]">Crop Name</label>
            <select
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620] focus:outline-none focus:border-[#556B2F] cursor-pointer"
            >
              <option value="tomato">Tomato (Policy: 2.0°C - 8.0°C)</option>
              <option value="potato">Potato (Policy: 4.0°C - 12.0°C)</option>
              <option value="onion">Onion (Policy: 0.0°C - 5.0°C)</option>
              <option value="apple">Apple (Policy: -1.0°C - 4.0°C)</option>
              <option value="mango">Mango (Policy: 10.0°C - 15.0°C)</option>
            </select>
          </div>

          {/* Temperature Slider & Value */}
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#3B3028] flex items-center gap-1">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-[#556B2F]" />
                Temperature
              </span>
              <span className={`font-extrabold ${temperature > 15 ? 'text-red-600' : 'text-[#2E3A1F]'}`}>
                {temperature}°C
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="range"
                min="-10"
                max="60"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#556B2F] cursor-pointer"
              />
              <input 
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-white border border-[#E6E1D5] rounded-lg text-xs font-mono font-bold text-center text-[#2D2620]"
              />
            </div>
          </div>

          {/* Humidity Slider & Value */}
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#3B3028] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[#556B2F]" />
                Humidity
              </span>
              <span className="font-extrabold text-[#2E3A1F]">
                {humidity}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="range"
                min="0"
                max="100"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
                className="w-full accent-[#556B2F] cursor-pointer"
              />
              <input 
                type="number"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-white border border-[#E6E1D5] rounded-lg text-xs font-mono font-bold text-center text-[#2D2620]"
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-bold text-[#3B3028] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#556B2F]" />
              GPS Coordinates (Latitude, Longitude)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                placeholder="Latitude"
                className="px-3 py-2 bg-white border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620]"
              />
              <input 
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                placeholder="Longitude"
                className="px-3 py-2 bg-white border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSendTelemetry}
            disabled={isEvaluating}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2E3A1F] text-white font-extrabold text-xs sm:text-sm hover:bg-[#1E2614] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating through AI Pipeline...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Verify with AI & Anchor to Blockchain</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notification */}
        {evalError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{evalError}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* LIVE RESULTS: AI VERDICT & BLOCKCHAIN WRITE CONFIRMATION */}
        {/* ======================================================== */}
        {evalResult && (
          <div className="mt-2 pt-4 border-t border-[#E6E1D5] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#666057]">
                Live Verification Receipt
              </span>
              <span className="text-[11px] font-mono text-[#786E65]">
                Reading ID: #{evalResult.reading_id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Card 1: AI Trust Layer Verdict */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
                evalResult.verdict === 'VALID' 
                  ? 'bg-emerald-50/70 border-emerald-300' 
                  : 'bg-red-50/70 border-red-300'
              }`}>
                <div className="flex items-center justify-between pb-1 border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <Cpu className={`w-4 h-4 ${evalResult.verdict === 'VALID' ? 'text-emerald-700' : 'text-red-700'}`} />
                    <span className="text-xs font-extrabold text-[#2D2620]">AI Trust Layer</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    evalResult.verdict === 'VALID' 
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-400' 
                      : 'bg-red-200 text-red-900 border border-red-400'
                  }`}>
                    {evalResult.verdict}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#666057]">Disposition:</span>
                    <span className="font-extrabold text-[#2D2620]">{evalResult.disposition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666057]">Isolation Forest ML Score:</span>
                    <span className="font-mono font-bold text-[#2D2620]">
                      {evalResult.anomaly_score !== null ? evalResult.anomaly_score : '0.0000 (Nominal)'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#666057]">Cryptographic Event Hash:</span>
                    <span className="font-mono text-[10px] text-[#2D2620] truncate bg-white/70 p-1 rounded border border-[#E6E1D5]">
                      {evalResult.event_hash || 'SHA256-verified'}
                    </span>
                  </div>
                </div>

                {evalResult.reason_codes && evalResult.reason_codes.length > 0 && (
                  <div className="mt-1 pt-1.5 border-t border-red-200 text-xs text-red-800">
                    <span className="font-bold text-[11px] block mb-0.5">Explainable Anomaly Reasons:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] font-semibold">
                      {evalResult.reason_codes.map((code, idx) => (
                        <li key={idx}>{code}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card 2: Blockchain Layer Disposition */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
                evalResult.tx_hash 
                  ? 'bg-[#F2F6ED] border-[#C3D4B6]' 
                  : 'bg-amber-50/70 border-amber-300'
              }`}>
                <div className="flex items-center justify-between pb-1 border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <Database className={`w-4 h-4 ${evalResult.tx_hash ? 'text-[#3D5220]' : 'text-amber-700'}`} />
                    <span className="text-xs font-extrabold text-[#2D2620]">Blockchain Layer</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    evalResult.tx_hash 
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-400' 
                      : 'bg-amber-200 text-amber-900 border border-amber-400'
                  }`}>
                    {evalResult.tx_hash ? 'MINED ON-CHAIN' : 'WRITE BLOCKED'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#666057]">Smart Contract:</span>
                    <span className="font-extrabold text-[#2D2620]">ColdChainMonitor.sol</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666057]">EVM Status:</span>
                    <span className="font-bold text-[#2D2620]">
                      {evalResult.tx_hash ? 'Slot-packed condition stored' : 'Rejected by AI Gatekeeper'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#666057]">Transaction Hash:</span>
                    {evalResult.tx_hash ? (
                      <span className="font-mono text-[10px] text-emerald-800 break-all bg-white p-1.5 rounded-lg border border-emerald-300 select-all">
                        0x{evalResult.tx_hash}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px] bg-white/70 p-1.5 rounded border border-amber-200">
                        <Ban className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                        <span>tx_hash: None (Ledger protected from pollution)</span>
                      </div>
                    )}
                  </div>
                </div>

                {!evalResult.tx_hash && (
                  <div className="mt-1 pt-1.5 border-t border-amber-200 flex justify-between items-center text-xs">
                    <span className="text-amber-900 font-semibold text-[11px]">
                      Quarantined in off-chain audit trail
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenDetails}
                      className="text-[11px] font-extrabold text-[#991B1B] hover:underline cursor-pointer"
                    >
                      View in Audit Log →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Retained: AI Verification Checkpoints Section */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#E6E1D5]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#786E65]">
          AI Verification Architecture Checkpoints
        </h3>
        {trustData.aiVerificationDetails && trustData.aiVerificationDetails.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#3D5220]" />
              <span className="font-bold text-[#3B3028]">{item.title}</span>
            </div>
            <span className="font-bold text-[#3D5220]">{item.status}</span>
          </div>
        ))}
      </div>

      {/* Quarantine Audit Modal */}
      <QuarantineAuditModal 
        isOpen={isQuarantineOpen} 
        onClose={() => setIsQuarantineOpen(false)} 
      />
    </div>
  );
};

