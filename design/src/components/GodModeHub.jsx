import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Droplets,
  Gauge,
  Truck,
  Store,
  ShoppingBag,
  Sprout,
  Radio,
  Cpu,
  Hash,
  ShieldAlert,
  Flame,
  Snowflake,
  ExternalLink,
  RefreshCw,
  Eye,
  Info,
  Sliders,
  BellRing
} from 'lucide-react';

const TOUR_STEPS_INFO = [
  {
    step: 1,
    title: "1. Farm Gate Harvest & On-Chain Anchoring",
    tagline: "Farmer Rahul Patil mints 1,000 kg harvest lot",
    insight: "The lot is anchored directly onto ProductRegistry.sol with GPS origin and guaranteed farm-gate minimum price (₹20/kg) in smart contract escrow."
  },
  {
    step: 2,
    title: "2. Cold Chain Highway Dispatch",
    tagline: "Safexpress Reefer Truck dispatches on NH-48",
    insight: "CustodyTransfer.sol updates state to IN_TRANSIT. IoT telematics stream valid 4.5°C temperature mined on ColdChainMonitor.sol with 0 breaches."
  },
  {
    step: 3,
    title: "3. In-Transit Reefer Breakdown & AI Quarantine",
    tagline: "🚨 Cooling compressor seizes on Pune Bypass (26.5°C Breach)",
    insight: "AI Trust Layer isolates the 26.5°C breach off-chain into the SHA-256 IsoLog hash-chain. Safexpress is penalized -₹16,000, while farmer payout (₹20,000) is 100% protected."
  },
  {
    step: 4,
    title: "4. Dark Store Receiving & Salvage Allocation",
    tagline: "Dark store receives 600 kg salvage lot at ₹18/kg",
    insight: "Automated inbound quality downgrade routes 600 kg salvage into the Fast-Clearance Bin with a dynamic 55% markdown, eliminating food waste."
  },
  {
    step: 5,
    title: "5. Consumer Provenance & Clearance Purchase",
    tagline: "Customer buys clearance tomatoes with verified proof",
    insight: "Consumer QR passport displays the transparent ₹22/kg price trail, verified 5★ review, and an immutable on-chain warning disclosure of the transit breach."
  }
];

export const GodModeHub = ({ onExit, onNavigateRoleAndTab }) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [godData, setGodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTourStep, setCurrentTourStep] = useState(1);
  const [isPlayingTour, setIsPlayingTour] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  // Manual IoT Controls
  const [manualTemp, setManualTemp] = useState(4.5);
  const [manualHumidity, setManualHumidity] = useState(85);
  const [manualSpeed, setManualSpeed] = useState(65);
  const [transmittingIoT, setTransmittingIoT] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const autoPlayTimerRef = useRef(null);

  // Fetch all batches on mount
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('http://localhost:8000/demo/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
        if (data.length > 0 && !selectedBatchId) {
          setSelectedBatchId(data[0].batch_id);
          fetchGodModeState(data[0].batch_id);
        }
      }
    } catch {
      // Fallback
      fetchGodModeState('latest');
    }
  };

  const fetchGodModeState = async (bId) => {
    setLoading(true);
    try {
      const target = bId || selectedBatchId || 'latest';
      const res = await fetch(`http://localhost:8000/demo/godmode/${target}`);
      if (res.ok) {
        const data = await res.json();
        setGodData(data);
        if (data.batch_id) {
          setSelectedBatchId(data.batch_id);
          if (data.logistics?.current_temp !== undefined) {
            setManualTemp(data.logistics.current_temp);
            setManualHumidity(data.logistics.current_humidity || 85);
            setManualSpeed(data.logistics.speed_kmh || 65);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-play Cinema Tour progression
  useEffect(() => {
    if (isPlayingTour) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentTourStep((prev) => {
          if (prev >= 5) {
            setIsPlayingTour(false);
            return 5;
          }
          const next = prev + 1;
          executeTourStep(next, selectedBatchId);
          return next;
        });
      }, 4000);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlayingTour, selectedBatchId]);

  const executeTourStep = async (stepNum, bId) => {
    setLoading(true);
    try {
      const payload = {
        step: stepNum,
        batch_id: stepNum === 1 ? null : bId
      };
      const res = await fetch('http://localhost:8000/demo/godmode/tour-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setGodData(data.state);
          setSelectedBatchId(data.batch_id);
          if (data.state.logistics?.current_temp !== undefined) {
            setManualTemp(data.state.logistics.current_temp);
            setManualHumidity(data.state.logistics.current_humidity || 85);
          }
        }
        setActionNotice(`Step ${stepNum} executed on-chain with ground-truth records!`);
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTour = () => {
    setCurrentTourStep(1);
    setIsPlayingTour(true);
    executeTourStep(1, null);
  };

  const handleStepManual = (stepNum) => {
    setIsPlayingTour(false);
    setCurrentTourStep(stepNum);
    executeTourStep(stepNum, selectedBatchId);
  };

  const handleManualTransmitIoT = async (tempToUse) => {
    setTransmittingIoT(true);
    const temp = tempToUse !== undefined ? tempToUse : manualTemp;
    try {
      const payload = {
        batch_id: selectedBatchId,
        temperature: temp,
        humidity: manualHumidity,
        speed_kmh: manualSpeed,
        simulate_replay: false,
        simulate_breach: temp > 10.0 || temp < 2.0
      };
      const res = await fetch('http://localhost:8000/demo/iot/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchGodModeState(selectedBatchId);
        setActionNotice(`Sensor telemetry (${temp}°C) transmitted! All 4 quadrants refreshed.`);
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransmittingIoT(false);
    }
  };

  const activeStepMeta = TOUR_STEPS_INFO[currentTourStep - 1] || TOUR_STEPS_INFO[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1612] text-[#E6E1D5] flex flex-col overflow-hidden animate-fade-in font-sans">
      
      {/* ===================================================================== */}
      {/* 1. TOP COMMAND COCKPIT & CINEMA CONTROLLER                            */}
      {/* ===================================================================== */}
      <header className="bg-[#241E18] border-b border-[#3D352E] px-4 py-2.5 sm:px-6 flex flex-col gap-2.5 flex-shrink-0 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Mode Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base text-white tracking-wide">
                  OMNISCIENT GOD MODE
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  4-Party Live Sync
                </span>
              </div>
              <p className="text-[11px] text-[#A89F91]">
                Real-Time Synchronized Blockchain & AI Supply Chain Command Center
              </p>
            </div>
          </div>

          {/* Center: Cinema Tour Step Controller */}
          <div className="flex items-center gap-2 bg-[#1A1612] p-1.5 rounded-2xl border border-[#3D352E]">
            <button
              onClick={isPlayingTour ? () => setIsPlayingTour(false) : handleStartTour}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                isPlayingTour
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-[#354424] hover:bg-[#43572D] text-white'
              }`}
            >
              {isPlayingTour ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isPlayingTour ? 'Pause Tour' : 'Play Live Tour'}</span>
            </button>

            <div className="h-5 w-px bg-[#3D352E]" />

            {/* Step Pills */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStepManual(s)}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                    currentTourStep === s
                      ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-300'
                      : 'bg-[#241E18] hover:bg-[#322A22] text-[#A89F91]'
                  }`}
                  title={`Jump to Step ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleStepManual(1)}
              className="p-1.5 rounded-lg bg-[#241E18] hover:bg-[#322A22] text-[#A89F91] hover:text-white transition-all cursor-pointer"
              title="Reset Live Tour"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Batch Selector, Hex Inspector, Exit */}
          <div className="flex items-center gap-2">
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                fetchGodModeState(e.target.value);
              }}
              className="px-2.5 py-1.5 bg-[#1A1612] text-xs font-mono font-bold text-amber-300 rounded-xl border border-[#3D352E] focus:outline-none focus:border-amber-500 max-w-[170px] truncate"
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  #{b.batch_id.slice(-10)} ({b.crop_name.split(' ')[0]})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowInspector(!showInspector)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showInspector
                  ? 'bg-purple-900/60 border-purple-400 text-purple-200 shadow-xs'
                  : 'bg-[#1A1612] border-[#3D352E] text-[#A89F91] hover:text-white hover:border-[#52473D]'
              }`}
              title="Toggle Cryptographic Hex & Gas Inspector"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Inspector</span>
            </button>

            <button
              onClick={onExit}
              className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 cursor-pointer transition-all"
              title="Exit God Mode to Standard Portals"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Storyline / IEEE Insight Tooltip */}
        <div className="bg-[#1A1612] rounded-xl px-3 py-1.5 border border-[#3D352E] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-nowrap">
              {activeStepMeta.title}
            </span>
            <p className="text-[#D1C9BE] text-[11px] truncate hidden md:inline">
              {activeStepMeta.insight}
            </p>
          </div>

          {/* Quick Malfunction Trigger Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              disabled={transmittingIoT}
              onClick={() => {
                setManualTemp(26.5);
                handleManualTransmitIoT(26.5);
              }}
              className="px-2 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-700 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all"
              title="Seize cooling compressor on highway"
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>🚨 Seize Compressor (26.5°C)</span>
            </button>

            <button
              disabled={transmittingIoT}
              onClick={() => {
                setManualTemp(4.5);
                handleManualTransmitIoT(4.5);
              }}
              className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all"
              title="Restore optimal chiller"
            >
              <Snowflake className="w-3 h-3 text-emerald-400" />
              <span>❄️ Restore Chill (4.5°C)</span>
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="bg-emerald-900/80 border border-emerald-500 text-emerald-200 px-3 py-1 rounded-lg text-xs font-bold animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}
      </header>

      {/* ===================================================================== */}
      {/* 2. CRYPTOGRAPHIC & ORACLE HEX INSPECTOR (EXPANDABLE)                  */}
      {/* ===================================================================== */}
      {showInspector && godData?.cryptographic_inspector && (
        <div className="bg-[#14110E] border-b border-purple-900/50 p-3 sm:px-6 flex flex-col gap-2.5 text-xs font-mono animate-fade-in flex-shrink-0">
          <div className="flex items-center justify-between text-purple-300">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Low-Level Cryptographic & Oracle Inspector (IEEE Reproducibility Layer)</span>
            </div>
            <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-800 text-purple-300">
              EVM Gas: {godData.cryptographic_inspector.evm_gas_counter.toLocaleString()} gas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
            <div className="bg-[#1C1814] p-2.5 rounded-xl border border-[#3D352E] flex flex-col gap-1">
              <span className="text-[#A89F91] text-[10px] font-sans font-bold flex items-center gap-1">
                <Hash className="w-3 h-3 text-purple-400" />
                Raw Sensor Payload Hex (OBD-II Packet):
              </span>
              <div className="break-all text-emerald-400 bg-black/40 p-1.5 rounded-md text-[10px]">
                {godData.cryptographic_inspector.raw_payload_hex}
              </div>
            </div>

            <div className="bg-[#1C1814] p-2.5 rounded-xl border border-[#3D352E] flex flex-col gap-1">
              <span className="text-[#A89F91] text-[10px] font-sans font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                SHA-256 Telemetry Fingerprint:
              </span>
              <div className="break-all text-amber-300 bg-black/40 p-1.5 rounded-md text-[10px]">
                {godData.cryptographic_inspector.sha256_fingerprint}
              </div>
            </div>

            <div className="bg-[#1C1814] p-2.5 rounded-xl border border-[#3D352E] flex flex-col gap-1">
              <span className="text-[#A89F91] text-[10px] font-sans font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                IsoLog Tamper-Proof Quarantine Hash:
              </span>
              <div className="break-all text-red-300 bg-black/40 p-1.5 rounded-md text-[10px]">
                {godData.cryptographic_inspector.isolog_entry_hash || 'No active breach quarantined'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MAIN 4-QUADRANT LIVE SYSTEM GRID                                   */}
      {/* ===================================================================== */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* =================================================================== */}
        {/* QUADRANT 1 (TOP-LEFT): FARMER FARM-GATE ORIGIN                      */}
        {/* =================================================================== */}
        <div className="bg-[#241E18] rounded-2xl border border-[#3D352E] p-4 flex flex-col gap-3 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#526B33]" />
          
          <div className="flex items-center justify-between border-b border-[#3D352E] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <div>
                <h3 className="font-black text-sm text-white">Quadrant 1: Farm Gate Origin</h3>
                <span className="text-[10px] font-bold text-[#8FA866] uppercase">
                  {godData?.farmer?.farmer_name || 'Rahul Patil'} • {godData?.farmer?.origin_farm}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateRoleAndTab('farmer', 'dashboard')}
              className="text-[11px] font-bold text-[#8FA866] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View Portal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E]">
              <span className="text-[10px] text-[#A89F91] block">Crop Lot:</span>
              <span className="font-extrabold text-white text-xs block truncate">
                {godData?.farmer?.crop_name || 'Cluster Tomatoes'}
              </span>
              <span className="text-[10px] text-[#8FA866] font-mono">
                {godData?.farmer?.quantity_kg || 1000} kg harvested
              </span>
            </div>

            <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E]">
              <span className="text-[10px] text-[#A89F91] block">Guaranteed Farm-Gate Payout:</span>
              <span className="font-extrabold text-emerald-400 text-sm block">
                ₹ {godData?.farmer?.guaranteed_payout_inr?.toLocaleString('en-IN') || '20,000'}
              </span>
              <span className="text-[10px] text-emerald-300 font-bold">
                @ ₹{godData?.farmer?.farm_gate_rate_inr || 20}/kg
              </span>
            </div>
          </div>

          {/* Smart Contract Protection Status */}
          <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
            godData?.has_spoilage
              ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
              : 'bg-[#1A1612] border-[#3D352E] text-[#D1C9BE]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Smart Contract Escrow Protection
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700">
                {godData?.farmer?.payout_status || 'ESCROW_LOCKED'}
              </span>
            </div>
            <p className="text-[11px] text-[#A89F91] leading-relaxed">
              {godData?.has_spoilage
                ? 'Carrier thermal fault verified. Smart contract rules executed automatic 100% farm-gate settlement preservation. Zero farmer financial liability.'
                : 'Produce departure condition verified compliant. Guaranteed minimum payout locked in decentralized escrow.'}
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono bg-[#1A1612] p-2 rounded-lg border border-[#3D352E] text-[#A89F91]">
            <span>Registration EVM Tx:</span>
            <span className="text-emerald-400 truncate max-w-[180px]">
              {godData?.farmer?.registration_tx || '0x...'}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* QUADRANT 2 (TOP-RIGHT): LOGISTICS REEFER TELEMATICS & HUD           */}
        {/* =================================================================== */}
        <div className="bg-[#241E18] rounded-2xl border border-[#3D352E] p-4 flex flex-col gap-3 shadow-md relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${
            godData?.logistics?.alarm_active ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`} />

          <div className="flex items-center justify-between border-b border-[#3D352E] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚛</span>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <span>Quadrant 2: Cold Chain Reefer Cockpit</span>
                  {godData?.logistics?.alarm_active && (
                    <span className="text-[9px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-full animate-bounce">
                      Alarm
                    </span>
                  )}
                </h3>
                <span className="text-[10px] font-bold text-blue-400 uppercase">
                  {godData?.logistics?.carrier || 'Safexpress Logistics'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateRoleAndTab('logistics', 'dashboard')}
              className="text-[11px] font-bold text-blue-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View Portal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Live Needle / Circular Arc Gauges */}
          <div className="grid grid-cols-3 gap-2">
            {/* Temp Gauge */}
            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${
              godData?.logistics?.current_temp > 15
                ? 'bg-red-950/50 border-red-700/80'
                : (godData?.logistics?.current_temp > 8 ? 'bg-amber-950/40 border-amber-700' : 'bg-[#1A1612] border-[#3D352E]')
            }`}>
              <Thermometer className={`w-4 h-4 mb-1 ${
                godData?.logistics?.current_temp > 15 ? 'text-red-400 animate-pulse' : 'text-blue-400'
              }`} />
              <span className="text-[10px] text-[#A89F91]">Reefer Temp</span>
              <span className={`text-base font-black font-mono ${
                godData?.logistics?.current_temp > 15 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {godData?.logistics?.current_temp?.toFixed(1) || '4.5'} °C
              </span>
              <span className="text-[9px] font-bold text-[#A89F91]">Target: 2-8°C</span>
            </div>

            {/* Humidity Gauge */}
            <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] flex flex-col items-center justify-center text-center">
              <Droplets className="w-4 h-4 mb-1 text-blue-400" />
              <span className="text-[10px] text-[#A89F91]">Humidity</span>
              <span className="text-base font-black font-mono text-white">
                {godData?.logistics?.current_humidity?.toFixed(0) || '85'} %
              </span>
              <span className="text-[9px] font-bold text-[#A89F91]">RH Nominal</span>
            </div>

            {/* Speed Gauge */}
            <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] flex flex-col items-center justify-center text-center">
              <Gauge className="w-4 h-4 mb-1 text-amber-400" />
              <span className="text-[10px] text-[#A89F91]">GPS Speed</span>
              <span className="text-base font-black font-mono text-white">
                {godData?.logistics?.speed_kmh?.toFixed(0) || '65'} km/h
              </span>
              <span className="text-[9px] font-bold text-[#A89F91]">Expressway</span>
            </div>
          </div>

          {/* Interactive Route Waypoint Progress */}
          <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#A89F91]">Live Highway Transit Route (NH-48):</span>
            <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
              {godData?.logistics?.gps_route?.map((wp, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded-lg border ${
                    wp.status === 'BREACH_POINT'
                      ? 'bg-red-950/80 border-red-600 text-red-200 animate-pulse'
                      : (wp.status === 'COMPLETED' || wp.status === 'ARRIVED'
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                          : 'bg-[#241E18] border-[#3D352E] text-[#6E645A]')
                  }`}
                >
                  <span className="block truncate text-[9px]">{wp.name}</span>
                  <span className="text-[8px] uppercase tracking-wider block font-mono">
                    {wp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Penalty Status */}
          <div className="flex items-center justify-between bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] text-xs">
            <div className="flex items-center gap-2">
              <BellRing className={`w-4 h-4 ${godData?.has_spoilage ? 'text-red-400 animate-bounce' : 'text-emerald-400'}`} />
              <div>
                <span className="text-[10px] text-[#A89F91] block">Carrier SLA Accountability:</span>
                <span className={`font-black ${godData?.has_spoilage ? 'text-red-400' : 'text-emerald-400'}`}>
                  {godData?.logistics?.sla_status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#A89F91] block">Financial Remittance Impact:</span>
              <span className={`font-mono font-black text-xs ${
                godData?.logistics?.penalty_inr > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {godData?.logistics?.penalty_inr > 0
                  ? `- ₹ ${godData.logistics.penalty_inr.toLocaleString('en-IN')} (Penalty)`
                  : '₹ 500 (Compliant Pay)'}
              </span>
            </div>
          </div>

          {/* Interactive Telemetry Slider Form inside Cockpit */}
          <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold text-[#A89F91]">Manual Sensor Override (Real Input):</span>
              <span className="font-mono text-[11px] font-bold text-amber-300">
                {manualTemp.toFixed(1)} °C
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="-5"
                max="50"
                step="0.5"
                value={manualTemp}
                onChange={(e) => setManualTemp(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#2E2822] rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <button
                disabled={transmittingIoT}
                onClick={() => handleManualTransmitIoT()}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                {transmittingIoT ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3" />}
                <span>Transmit</span>
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* QUADRANT 3 (BOTTOM-LEFT): DARK STORE MICRO-HUB & INBOUND            */}
        {/* =================================================================== */}
        <div className="bg-[#241E18] rounded-2xl border border-[#3D352E] p-4 flex flex-col gap-3 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />

          <div className="flex items-center justify-between border-b border-[#3D352E] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏬</span>
              <div>
                <h3 className="font-black text-sm text-white">Quadrant 3: Dark Store Micro-Hub</h3>
                <span className="text-[10px] font-bold text-orange-400 uppercase">
                  {godData?.dark_store?.hub_name}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateRoleAndTab('darkstore', 'dashboard')}
              className="text-[11px] font-bold text-orange-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View Portal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E]">
              <span className="text-[10px] text-[#A89F91] block">Inbound Intake Disposition:</span>
              <span className={`font-extrabold text-xs block truncate ${
                godData?.has_spoilage ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {godData?.dark_store?.intake_status}
              </span>
              <span className="text-[10px] text-[#A89F91]">
                Bay: {godData?.dark_store?.bay_location}
              </span>
            </div>

            <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E]">
              <span className="text-[10px] text-[#A89F91] block">Salvage Allocation:</span>
              <span className="font-extrabold text-white text-sm block">
                {godData?.dark_store?.salvage_lot_kg} kg
              </span>
              <span className="text-[10px] text-amber-300 font-bold">
                @ ₹{godData?.dark_store?.intake_cost_per_kg}/kg (Discounted)
              </span>
            </div>
          </div>

          {/* Dynamic Markdown & FEFO Expiry Safeguard */}
          <div className="bg-[#1A1612] p-3 rounded-xl border border-[#3D352E] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#A89F91]">Zero-Waste FEFO Ripening Safeguard:</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {godData?.dark_store?.fefo_expiry_days} Days Remaining
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#3D352E]">
              <span className="text-[11px] text-[#D1C9BE]">Automated Salvage Markdown:</span>
              <span className="font-bold text-amber-400 text-sm">
                -{godData?.dark_store?.dynamic_markdown_pct}% Markdown
              </span>
            </div>

            <p className="text-[10px] text-[#A89F91] leading-relaxed">
              Automated AI algorithm marks down expiring salvage produce in the micro-hub to accelerate clearance to local consumers before spoilage occurs.
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono bg-[#1A1612] p-2 rounded-lg border border-[#3D352E]">
            <span className="text-[#A89F91]">On-Chain Circuit Breaker:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${
              godData?.dark_store?.circuit_breaker === 'PASS'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-red-950 text-red-300 border border-red-800'
            }`}>
              {godData?.dark_store?.circuit_breaker}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* QUADRANT 4 (BOTTOM-RIGHT): CONSUMER QR PASSPORT & PROVENANCE        */}
        {/* =================================================================== */}
        <div className="bg-[#241E18] rounded-2xl border border-[#3D352E] p-4 flex flex-col gap-3 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />

          <div className="flex items-center justify-between border-b border-[#3D352E] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <div>
                <h3 className="font-black text-sm text-white">Quadrant 4: Consumer QR Provenance Passport</h3>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">
                  Transparent Farm-to-Fork Trail
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateRoleAndTab('consumer', 'journey', godData?.batch_id)}
              className="text-[11px] font-bold text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View Passport</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Product Clearance Title & Real-Time Price */}
          <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] flex justify-between items-center">
            <div>
              <span className="text-[10px] text-[#A89F91] block">Retail Listing:</span>
              <h4 className="font-extrabold text-white text-xs truncate max-w-[220px]">
                {godData?.consumer?.product_title}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#A89F91] line-through block">
                ₹ {godData?.consumer?.original_price_inr || 55}/kg
              </span>
              <span className="font-black text-base text-amber-400">
                ₹ {godData?.consumer?.retail_price_inr || 22}/kg
              </span>
            </div>
          </div>

          {/* Transparent Thermal Warning Badge */}
          {godData?.consumer?.thermal_incident_flag && (
            <div className="bg-amber-950/40 border border-amber-600/70 p-2.5 rounded-xl flex items-center gap-2 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="leading-tight text-[11px]">
                <strong className="font-bold text-amber-300 block">⚠️ On-Chain Thermal Disclosure:</strong>
                Transit temperature excursion logged on-chain. Safe for sauces, puree, and cooked dishes.
              </div>
            </div>
          )}

          {/* Full Farm-to-Fork Price Trail Breakdown */}
          <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#A89F91]">Verifiable On-Chain Price Build-up:</span>
            <div className="flex flex-col gap-1 text-[11px]">
              {godData?.consumer?.price_trail?.map((hop, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#2C241D] last:border-b-0">
                  <span className="text-[#D1C9BE] text-[10px]">{hop.stage} ({hop.holder}):</span>
                  <span className="font-mono font-bold text-white text-[10px]">
                    ₹ {hop.price_inr.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Customer Review */}
          <div className="bg-[#1A1612] p-2.5 rounded-xl border border-[#3D352E] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span>★ {godData?.consumer?.passport_rating || '5.0'}</span>
              <span className="text-[10px] text-[#A89F91]">({godData?.consumer?.verified_reviews_count} verified review)</span>
            </div>
            <p className="text-[10px] text-[#A89F91] truncate max-w-[240px] italic">
              "{godData?.consumer?.latest_review}"
            </p>
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* 4. FOOTER STATUS BAR                                                  */}
      {/* ===================================================================== */}
      <footer className="bg-[#241E18] border-t border-[#3D352E] px-4 py-2 sm:px-6 flex items-center justify-between text-[11px] text-[#A89F91] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hardhat EVM Localhost (:8545)
          </span>
          <span>•</span>
          <span className="font-mono text-white">
            Active Batch: <strong>#{selectedBatchId}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">FastAPI :8000 Ground Truth</span>
          <button
            onClick={() => fetchGodModeState(selectedBatchId)}
            className="p-1 rounded hover:bg-[#322A22] text-[#A89F91] hover:text-white cursor-pointer"
            title="Manual Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </footer>

    </div>
  );
};
