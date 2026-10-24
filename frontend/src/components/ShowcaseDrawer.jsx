import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  X, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Radio, 
  Sprout, 
  Truck, 
  Store, 
  ShoppingBag, 
  Layers, 
  RefreshCw, 
  Sliders, 
  ChevronRight,
  TrendingDown,
  ExternalLink,
  Flame,
  Snowflake,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { CleanSlateModal } from './CleanSlateModal';

export const ShowcaseDrawer = ({ onNavigateRoleAndTab, isOpenExternal, setIsOpenExternal }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : internalIsOpen;
  const setIsOpen = setIsOpenExternal !== undefined ? setIsOpenExternal : setInternalIsOpen;
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'iot' | 'produce' | 'custody' | 'reset'
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Data State
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  // Scenarios State
  const [runningScenario, setRunningScenario] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);

  // IoT Sliders State
  const [iotBatchId, setIotBatchId] = useState('');
  const [temperature, setTemperature] = useState(4.5);
  const [humidity, setHumidity] = useState(88.0);
  const [speed, setSpeed] = useState(50.0);
  const [simulateReplay, setSimulateReplay] = useState(false);
  const [iotSending, setIotSending] = useState(false);
  const [iotResult, setIotResult] = useState(null);

  // Quick Produce State
  const [produceCrop, setProduceCrop] = useState('Organic Tomatoes');
  const [produceQty, setProduceQty] = useState(500);
  const [produceFarm, setProduceFarm] = useState('Nashik Valley Cluster #4');
  const [produceFarmer, setProduceFarmer] = useState('Rahul Patil');
  const [producePrice, setProducePrice] = useState(40.0);
  const [produceCreating, setProduceCreating] = useState(false);
  const [produceResult, setProduceResult] = useState(null);

  // Custody Stepper State
  const [custodyBatchId, setCustodyBatchId] = useState('');
  const [custodyAdvancing, setCustodyAdvancing] = useState(false);
  const [custodyResult, setCustodyResult] = useState(null);

  const fetchBatches = () => {
    fetch('http://localhost:8000/demo/batches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBatches(data);
          if (!selectedBatchId) setSelectedBatchId(data[0].batch_id);
          if (!iotBatchId) setIotBatchId(data[0].batch_id);
          if (!custodyBatchId) setCustodyBatchId(data[0].batch_id);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBatches();
  }, [isOpen]);

  const runScenario = async (scenarioId) => {
    setRunningScenario(scenarioId);
    setScenarioResult(null);
    try {
      const res = await fetch(`http://localhost:8000/demo/scenarios/${scenarioId}`, {
        method: 'POST'
      });
      const data = await res.json();
      setScenarioResult(data);
      fetchBatches();
      if (data.batch_id) {
        setSelectedBatchId(data.batch_id);
        setIotBatchId(data.batch_id);
        setCustodyBatchId(data.batch_id);
      }
      window.dispatchEvent(new CustomEvent('agrichain-data-updated'));
    } catch (err) {
      console.error('Scenario run error:', err);
    } finally {
      setRunningScenario(null);
    }
  };

  const handleTransmitIoT = async () => {
    if (!iotBatchId) return;
    setIotSending(true);
    setIotResult(null);
    try {
      const res = await fetch('http://localhost:8000/demo/iot/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: iotBatchId,
          temperature: parseFloat(temperature),
          humidity: parseFloat(humidity),
          speed_kmh: parseFloat(speed),
          simulate_replay: simulateReplay
        })
      });
      const data = await res.json();
      setIotResult(data);
      window.dispatchEvent(new CustomEvent('agrichain-data-updated'));
    } catch (err) {
      console.error('IoT transmission error:', err);
    } finally {
      setIotSending(false);
    }
  };

  const handleCreateProduce = async () => {
    setProduceCreating(true);
    setProduceResult(null);
    try {
      const res = await fetch('http://localhost:8000/demo/produce/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_name: produceCrop,
          quantity_kg: parseFloat(produceQty),
          origin_farm: produceFarm,
          farmer_name: produceFarmer,
          category: produceCrop.toLowerCase().includes('mango') || produceCrop.toLowerCase().includes('straw') ? 'fruits' : 'vegetables',
          price_per_kg: parseFloat(producePrice)
        })
      });
      const data = await res.json();
      setProduceResult(data);
      fetchBatches();
      if (data.batch_id) {
        setSelectedBatchId(data.batch_id);
        setIotBatchId(data.batch_id);
        setCustodyBatchId(data.batch_id);
      }
      window.dispatchEvent(new CustomEvent('agrichain-data-updated'));
    } catch (err) {
      console.error('Produce create error:', err);
    } finally {
      setProduceCreating(false);
    }
  };

  const handleAdvanceCustody = async (nextState, holderName, pricePaise) => {
    if (!custodyBatchId) return;
    setCustodyAdvancing(true);
    setCustodyResult(null);
    try {
      const res = await fetch('http://localhost:8000/demo/custody/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: custodyBatchId,
          next_state: nextState,
          holder_name: holderName,
          price_paise: pricePaise
        })
      });
      const data = await res.json();
      setCustodyResult(data);
      fetchBatches();
      window.dispatchEvent(new CustomEvent('agrichain-data-updated'));
    } catch (err) {
      console.error('Custody advance error:', err);
    } finally {
      setCustodyAdvancing(false);
    }
  };

  return (
    <>
      {/* 1. Floating Showcase Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-5 z-40 bg-gradient-to-r from-[#29452A] to-[#3D5A2B] text-white px-4 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-2.5 font-extrabold text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
        <span>Showcase & Demo Lab</span>
      </button>

      {/* 2. Slide-Over Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* 3. Slide-Over Drawer Container */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#FAF8F5] shadow-2xl z-50 border-l border-[#E6E1D5] flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E6E1D5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#354424] text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#2D2620]">Showcase & Demo Lab</h3>
              <p className="text-[11px] text-[#666057] font-semibold">1-Click Scenarios, IoT Simulation & Produce Controls</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] hover:bg-[#E6E1D5] flex items-center justify-center text-[#666057] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-2.5 bg-white border-b border-[#E6E1D5] gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'scenarios', label: '1-Click Scenarios', icon: Play },
            { id: 'iot', label: 'IoT Sliders', icon: Radio },
            { id: 'produce', label: 'New Goods', icon: Sprout },
            { id: 'custody', label: 'Custody Stepper', icon: Layers },
            { id: 'reset', label: 'Clean Slate', icon: Trash2 }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  active 
                    ? 'bg-[#354424] text-white shadow-xs' 
                    : 'text-[#666057] hover:bg-[#FAF7F0] hover:text-[#2D2620]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          
          {/* ============================================================= */}
          {/* TAB 1: 1-CLICK SCENARIOS                                      */}
          {/* ============================================================= */}
          {activeTab === 'scenarios' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-medium">
                💡 <strong className="font-bold">Judge / Evaluator Ready:</strong> Trigger complete supply chain journeys instantly. All on-chain smart contracts, IoT hashes, and pricing trails update live across all roles.
              </div>

              {/* Scenario 1: Golden Harvest */}
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-2.5 hover:border-[#354424] transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-[#2D2620]">1. The Golden Harvest</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Pristine End-to-End Journey
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={runningScenario !== null}
                    onClick={() => runScenario('golden-path')}
                    className="px-3 py-1.5 rounded-xl bg-[#354424] text-white text-xs font-bold hover:bg-[#2D3B1E] disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {runningScenario === 'golden-path' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                    <span>Run</span>
                  </button>
                </div>
                <p className="text-xs text-[#666057] leading-relaxed">
                  Farmer harvests Alphonso Mangoes in Ratnagiri → Safexpress transports at 4°C → Dark Store receives 100% fresh → Consumer receives delivery with 5★ review. 100% compliant price build-up.
                </p>
              </div>

              {/* Scenario 2: In-Transit Spoilage (User Special) */}
              <div className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-xs flex flex-col gap-2.5 hover:border-red-400 transition-all bg-gradient-to-br from-white to-red-50/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-red-950">2. In-Transit Thermal Spoilage & Multi-Role Impact</h4>
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        Cascading Price & Quality Impact
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={runningScenario !== null}
                    onClick={() => runScenario('transit-degradation')}
                    className="px-3 py-1.5 rounded-xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {runningScenario === 'transit-degradation' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                    <span>Run</span>
                  </button>
                </div>
                <p className="text-xs text-[#666057] leading-relaxed">
                  Reefer trailer breaks down on Mumbai highway (26.5°C breach). 400 kg spoiled (₹16,000 carrier SLA penalty deducted); farmer protected with ₹20,000 guaranteed payment; dark store allocates remaining 600 kg to clearance bay; consumer gets discounted clearance price with on-chain warning.
                </p>
              </div>

              {/* Scenario 3: Reefer Breakdown & Quarantine */}
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-2.5 hover:border-amber-500 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-[#2D2620]">3. Highway Reefer Breakdown & Quarantine</h4>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        AI Circuit Breaker
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={runningScenario !== null}
                    onClick={() => runScenario('thermal-quarantine')}
                    className="px-3 py-1.5 rounded-xl bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {runningScenario === 'thermal-quarantine' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                    <span>Run</span>
                  </button>
                </div>
                <p className="text-xs text-[#666057] leading-relaxed">
                  Compressor seized at 48°C. AI Trust Layer catches breach off-chain, records IsoLog cryptographic tamper-proof hash, and circuit breaker blocks dark store intake.
                </p>
              </div>

              {/* Scenario 4: Sensor Replay Fraud */}
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-2.5 hover:border-purple-600 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-[#2D2620]">4. Sensor Replay & Spoofing Attack</h4>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        SHA-256 Duplicate Defense
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={runningScenario !== null}
                    onClick={() => runScenario('sensor-replay-fraud')}
                    className="px-3 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {runningScenario === 'sensor-replay-fraud' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                    <span>Run</span>
                  </button>
                </div>
                <p className="text-xs text-[#666057] leading-relaxed">
                  Attacker attempts to forge clean temperature by replaying past legitimate telemetry packet. Cryptographic fingerprint engine isolates fraud before oracle submission.
                </p>
              </div>

              {/* Scenario 5: FEFO Dynamic Discounting */}
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-2.5 hover:border-emerald-600 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏳</span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-[#2D2620]">5. FEFO Spoilage & Dynamic Discounting</h4>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        Zero Food Waste AI
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={runningScenario !== null}
                    onClick={() => runScenario('fefo-discount')}
                    className="px-3 py-1.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {runningScenario === 'fefo-discount' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                    <span>Run</span>
                  </button>
                </div>
                <p className="text-xs text-[#666057] leading-relaxed">
                  Shelf-life AI detects strawberries in Bay 3 with 2 days remaining. Triggers automated 40% retail markdown (₹80 → ₹48), clearing stock with zero physical waste.
                </p>
              </div>

              {/* Active Scenario Execution Result Card */}
              {scenarioResult && (
                <div className="mt-2 bg-[#FAF7F0] border border-[#E6E1D5] rounded-2xl p-4 flex flex-col gap-3 shadow-md animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#2D2620] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Scenario Executed Successfully
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#354424] bg-white px-2 py-0.5 rounded-md border border-[#E6E1D5]">
                      #{scenarioResult.batch_id}
                    </span>
                  </div>

                  <p className="text-xs text-[#354424] font-medium leading-normal bg-white p-2.5 rounded-xl border border-[#E6E1D5]">
                    {scenarioResult.summary}
                  </p>

                  {/* Multi-Role Impact Card (if Transit Degradation) */}
                  {scenarioResult.multi_role_impact && (
                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-xs font-black text-[#2D2620]">Multi-Role Impact Breakdown:</span>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D5]">
                          <span className="font-extrabold text-[#354424] block">🌿 Farmer</span>
                          <span className="text-emerald-700 font-bold block">{scenarioResult.multi_role_impact.farmer.payout}</span>
                          <span className="text-[10px] text-[#666057]">{scenarioResult.multi_role_impact.farmer.fault}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-red-200">
                          <span className="font-extrabold text-red-800 block">🚛 Logistics</span>
                          <span className="text-red-700 font-bold block">{scenarioResult.multi_role_impact.logistics.penalty}</span>
                          <span className="text-[10px] text-[#666057]">{scenarioResult.multi_role_impact.logistics.status}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D5]">
                          <span className="font-extrabold text-[#2D2620] block">🏬 Dark Store</span>
                          <span className="text-[#354424] font-bold block">
                            {(scenarioResult.multi_role_impact.dark_store || scenarioResult.multi_role_impact.darkstore)?.salvage_cost}
                          </span>
                          <span className="text-[10px] text-[#666057]">
                            {(scenarioResult.multi_role_impact.dark_store || scenarioResult.multi_role_impact.darkstore)?.total_salvage_lot}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <span className="font-extrabold text-amber-900 block">🛒 Consumer</span>
                          <span className="text-amber-800 font-bold block">{scenarioResult.multi_role_impact.consumer.retail_price}</span>
                          <span className="text-[10px] text-[#666057]">{scenarioResult.multi_role_impact.consumer.passport_warning}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Shortcuts */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-[#E6E1D5]">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateRoleAndTab('consumer', 'journey', scenarioResult.batch_id);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white text-[#354424] border border-[#354424] text-[11px] font-extrabold hover:bg-[#354424] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>View in Consumer Passport</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateRoleAndTab('farmer', 'inventory', scenarioResult.batch_id);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white text-[#354424] border border-[#E6E1D5] text-[11px] font-extrabold hover:bg-[#FAF7F0] transition-all cursor-pointer"
                    >
                      Farmer Inventory
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateRoleAndTab('logistics', 'shipment-tracking', scenarioResult.batch_id);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white text-[#354424] border border-[#E6E1D5] text-[11px] font-extrabold hover:bg-[#FAF7F0] transition-all cursor-pointer"
                    >
                      Logistics Telemetry
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: INTERACTIVE IOT TELEMETRY SLIDERS                      */}
          {/* ============================================================= */}
          {activeTab === 'iot' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-3">
                <label className="text-xs font-black text-[#2D2620]">Target Produce Batch:</label>
                <select
                  value={iotBatchId}
                  onChange={(e) => setIotBatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                >
                  {batches.map(b => (
                    <option key={b.batch_id} value={b.batch_id}>
                      {b.crop_name} (#{b.batch_id.slice(-8)}) - {b.current_state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sliders Container */}
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-4">
                {/* 1. Temperature Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#2D2620] flex items-center gap-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                      Temperature Sensor:
                    </span>
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
                      temperature > 15 ? 'bg-red-100 text-red-800' : (temperature > 8 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {temperature.toFixed(1)} °C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="50"
                    step="0.5"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#FAF7F0] rounded-lg appearance-none cursor-pointer accent-[#354424]"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-[#666057]">
                    <span>-5°C (Chilled)</span>
                    <span className="text-emerald-700 font-bold">Optimal (2-8°C)</span>
                    <span className="text-red-700 font-bold">50°C (Breach)</span>
                  </div>
                </div>

                {/* 2. Humidity Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#2D2620]">Relative Humidity:</span>
                    <span className="text-xs font-mono font-black text-[#354424] bg-emerald-50 px-2 py-0.5 rounded-md border border-[#E6E1D5]">
                      {humidity.toFixed(0)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={humidity}
                    onChange={(e) => setHumidity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#FAF7F0] rounded-lg appearance-none cursor-pointer accent-[#354424]"
                  />
                </div>

                {/* 3. Speed Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#2D2620]">Vehicle GPS Speed:</span>
                    <span className="text-xs font-mono font-black text-[#2D2620] bg-[#FAF7F0] px-2 py-0.5 rounded-md">
                      {speed.toFixed(0)} km/h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#FAF7F0] rounded-lg appearance-none cursor-pointer accent-[#354424]"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#E6E1D5]">
                  <span className="text-[11px] font-bold text-[#666057]">Fast Presets:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setTemperature(4.5); setHumidity(88); setSimulateReplay(false); }}
                      className="px-2 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E6E1D5] text-[11px] font-bold text-[#354424] text-left cursor-pointer"
                    >
                      ❄️ Normal (4.5°C)
                    </button>
                    <button
                      onClick={() => { setTemperature(48.0); setHumidity(35); setSimulateReplay(false); }}
                      className="px-2 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[11px] font-bold text-red-800 text-left cursor-pointer"
                    >
                      🔥 Heat Spike (48°C)
                    </button>
                    <button
                      onClick={() => { setTemperature(26.5); setHumidity(62); setSimulateReplay(false); }}
                      className="px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 text-left cursor-pointer"
                    >
                      ⚠️ Highway Spoil (26.5°C)
                    </button>
                    <button
                      onClick={() => { setTemperature(4.5); setHumidity(88); setSimulateReplay(true); }}
                      className="px-2 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[11px] font-bold text-purple-800 text-left cursor-pointer"
                    >
                      🔄 Replay Attack Fraud
                    </button>
                  </div>
                </div>

                {/* Transmit Button */}
                <button
                  disabled={iotSending || !iotBatchId}
                  onClick={handleTransmitIoT}
                  className="w-full py-2.5 rounded-xl bg-[#354424] text-white text-xs font-extrabold hover:bg-[#2D3B1E] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {iotSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                  <span>Transmit Reading to Oracle / AI</span>
                </button>
              </div>

              {/* IoT Evaluation Result */}
              {iotResult && (
                <div className={`rounded-2xl p-4 border flex flex-col gap-2 shadow-xs animate-fade-in ${
                  iotResult.verdict === 'VALID' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      {iotResult.verdict === 'VALID' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                      Verdict: {iotResult.verdict}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/80">
                      {iotResult.disposition}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed">
                    {iotResult.reason}
                  </p>

                  {iotResult.tx_hash && (
                    <div className="text-[10px] font-mono bg-white/90 p-2 rounded-lg border border-emerald-200 break-all">
                      <span className="font-bold block text-emerald-800">EVM On-Chain Transaction:</span>
                      {iotResult.tx_hash}
                    </div>
                  )}

                  {iotResult.quarantine_hash && (
                    <div className="text-[10px] font-mono bg-white/90 p-2 rounded-lg border border-red-200 break-all">
                      <span className="font-bold block text-red-800">IsoLog Tamper-Evident Hash:</span>
                      {iotResult.quarantine_hash}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 3: FAST PRODUCE CREATOR                                   */}
          {/* ============================================================= */}
          {activeTab === 'produce' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-3">
                <h4 className="font-black text-xs sm:text-sm text-[#2D2620]">Onboard New Farm Goods</h4>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#666057]">Crop Type:</label>
                  <select
                    value={produceCrop}
                    onChange={(e) => setProduceCrop(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                  >
                    <option value="Organic Field Tomatoes">Organic Field Tomatoes</option>
                    <option value="Alphonso Mango">Alphonso Mango</option>
                    <option value="Fresh Strawberries">Fresh Strawberries</option>
                    <option value="Sharbati Golden Wheat">Sharbati Golden Wheat</option>
                    <option value="Thompson Seedless Grapes">Thompson Seedless Grapes</option>
                    <option value="Baby Spinach">Baby Spinach</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#666057]">Quantity (kg):</label>
                    <input
                      type="number"
                      value={produceQty}
                      onChange={(e) => setProduceQty(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#666057]">Price (₹ / kg):</label>
                    <input
                      type="number"
                      value={producePrice}
                      onChange={(e) => setProducePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#666057]">Farm Cluster Origin:</label>
                  <input
                    type="text"
                    value={produceFarm}
                    onChange={(e) => setProduceFarm(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#666057]">Farmer Name:</label>
                  <input
                    type="text"
                    value={produceFarmer}
                    onChange={(e) => setProduceFarmer(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                  />
                </div>

                <button
                  disabled={produceCreating}
                  onClick={handleCreateProduce}
                  className="w-full py-2.5 mt-2 rounded-xl bg-[#354424] text-white text-xs font-extrabold hover:bg-[#2D3B1E] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {produceCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sprout className="w-4 h-4" />}
                  <span>Register & Anchor On-Chain</span>
                </button>
              </div>

              {produceResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-2 shadow-xs animate-fade-in text-emerald-950">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Batch Registered On-Chain!
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {produceResult.batch_id}
                    </span>
                  </div>
                  <p className="text-xs text-[#666057]">
                    Total Lot Value: <strong>₹ {produceResult.price_inr.toLocaleString('en-IN')}</strong> ({produceResult.quantity_kg} kg @ ₹{producePrice}/kg)
                  </p>
                  <div className="text-[10px] font-mono bg-white p-2 rounded-lg border border-emerald-200 break-all">
                    <span className="font-bold block text-emerald-800">EVM Tx Hash:</span>
                    {produceResult.tx_hash}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 4: CUSTODY PROGRESSION STEPPER                            */}
          {/* ============================================================= */}
          {activeTab === 'custody' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-3">
                <label className="text-xs font-black text-[#2D2620]">Select Batch to Advance:</label>
                <select
                  value={custodyBatchId}
                  onChange={(e) => setCustodyBatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F0] rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#2D2620] focus:outline-none focus:border-[#354424]"
                >
                  {batches.map(b => (
                    <option key={b.batch_id} value={b.batch_id}>
                      {b.crop_name} (#{b.batch_id.slice(-8)}) - State: {b.current_state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custody Buttons */}
              <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs flex flex-col gap-2.5">
                <h4 className="font-black text-xs text-[#2D2620]">1-Click State Transitions:</h4>

                <button
                  disabled={custodyAdvancing || !custodyBatchId}
                  onClick={() => handleAdvanceCustody('IN_TRANSIT', 'Safexpress Cold Chain Logistics', null)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#E6E1D5] text-[#2D2620] text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer border border-[#E6E1D5]"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#354424]" />
                    <span>1. Dispatch to Logistics (IN_TRANSIT)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">+₹ 500 Freight</span>
                </button>

                <button
                  disabled={custodyAdvancing || !custodyBatchId}
                  onClick={() => handleAdvanceCustody('IN_STORAGE', 'Pune Fresh DarkStore Hub', null)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#E6E1D5] text-[#2D2620] text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer border border-[#E6E1D5]"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#354424]" />
                    <span>2. Receive at Dark Store (IN_STORAGE)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">+₹ 550 Storage</span>
                </button>

                <button
                  disabled={custodyAdvancing || !custodyBatchId}
                  onClick={() => handleAdvanceCustody('SOLD', 'Priya Sharma (Home Delivery)', null)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#354424] text-white hover:bg-[#2D3B1E] text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>3. Fulfill Consumer Order (SOLD)</span>
                  </span>
                  <span className="text-[10px] text-emerald-200 font-bold">+₹ 650 Retail</span>
                </button>
              </div>

              {custodyResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-2 shadow-xs animate-fade-in text-emerald-950">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Custody Transferred On-Chain!
                    </span>
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 uppercase">
                      {custodyResult.state}
                    </span>
                  </div>
                  <p className="text-xs text-[#666057]">
                    New Custodian: <strong>{custodyResult.to_holder}</strong> • Cumulative Settlement: <strong>₹ {custodyResult.price_inr}</strong>
                  </p>
                  <div className="text-[10px] font-mono bg-white p-2 rounded-lg border border-emerald-200 break-all">
                    <span className="font-bold block text-emerald-800">EVM Tx:</span>
                    {custodyResult.tx_hash}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 5: CLEAN SLATE & RESET                                    */}
          {/* ============================================================= */}
          {activeTab === 'reset' && (
            <div className="flex flex-col gap-3.5 animate-fade-in">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-950 font-medium">
                🧹 <strong className="font-bold">Presentation Slate Prep:</strong> Wipe all previous batches, warehouse inventory, telemetry readings, and spoilage claims. All participant accounts, on-chain role authorizations, and crop policies will remain intact so you can demonstrate the framework from a clean fresh slate.
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E6E1D5] shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#2D2620]">Reset All Roles to Zero Inventory</h4>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      Farmer • Logistics • Dark Store • Consumer
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#666057] leading-relaxed">
                  Click below to clear all state. Once wiped, you can use the <strong>New Goods</strong> tab or the Farmer dashboard to register a brand new crop lot live in front of your audience.
                </p>

                <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E6E1D5] text-xs font-mono space-y-1">
                  <div className="flex justify-between text-[#666057]">
                    <span>Current Batches in DB:</span>
                    <span className="font-bold text-[#2D2620]">{batches.length}</span>
                  </div>
                  <div className="flex justify-between text-[#666057]">
                    <span>Target State:</span>
                    <span className="font-bold text-emerald-700">0 kg / Clean Slate</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Purge Data & Reset System Now</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Confirmation Modal */}
        <CleanSlateModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onResetComplete={() => {
            fetchBatches();
            setSelectedBatchId('');
            setIotBatchId('');
            setCustodyBatchId('');
          }}
        />

        {/* Drawer Footer with Quick Live Status */}
        <div className="p-3.5 bg-white border-t border-[#E6E1D5] flex items-center justify-between text-xs text-[#666057]">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hardhat EVM Localhost :8545 Active
          </span>
          <span className="font-bold text-[#354424]">FastAPI :8000</span>
        </div>
      </div>
    </>
  );
};
