import React, { useEffect, useMemo, useState } from 'react';
import {
  X, Radio, Cpu, Search, Link2, Unlink, CheckCircle2, AlertTriangle, RefreshCw, Wifi, WifiOff, Package,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';

const STATE_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'IN_STORAGE', label: 'At dark store' },
  { key: 'AT_RETAIL', label: 'At retail' },
  { key: 'REGISTERED', label: 'At farm' },
];

const STATE_CHIP = {
  IN_TRANSIT: 'bg-[#2B6CB0]/15 text-[#2B6CB0]',
  IN_STORAGE: 'bg-[#556B2F]/15 text-[#556B2F]',
  AT_RETAIL: 'bg-[#354424]/15 text-[#354424]',
  REGISTERED: 'bg-[#B85C38]/15 text-[#B85C38]',
  SOLD: 'bg-gray-100 text-gray-700',
};

export const KindBadge = ({ kind }) => (
  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide ${
    kind === 'SIMULATED' ? 'bg-purple-100 text-purple-800' : 'bg-[#2D2620] text-white'
  }`}>
    {kind === 'SIMULATED' ? 'VIRTUAL' : 'HARDWARE'}
  </span>
);

/**
 * Pick a sensor and a produce batch, then link them. Opened from logistics tracking and dark
 * store intake. `initialBatchId` / `initialDeviceId` preselect one side.
 */
export const IoTLinkModal = ({ isOpen, onClose, initialBatchId = null, initialDeviceId = null, onLinked, assignedBy = 'web' }) => {
  const [devices, setDevices] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const [batchId, setBatchId] = useState(initialBatchId);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [showSold, setShowSold] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [devs, bats] = await Promise.all([
        apiRequest('/devices'),
        apiRequest(`/iot/assignable-batches?include_sold=${showSold}`),
      ]);
      setDevices(Array.isArray(devs) ? devs : []);
      setBatches(Array.isArray(bats) ? bats : []);
      setDeviceId((current) => {
        if (current && devs.some((d) => d.deviceId === current)) return current;
        const preferred = devs.find((d) => d.kind === 'HARDWARE' && d.online) || devs.find((d) => d.kind === 'HARDWARE') || devs[0];
        return preferred ? preferred.deviceId : null;
      });
    } catch (e) {
      setError(e.message || 'Could not load sensors and batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setBatchId(initialBatchId);
    if (initialDeviceId) setDeviceId(initialDeviceId);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showSold]);

  const device = devices.find((d) => d.deviceId === deviceId) || null;
  const batch = batches.find((b) => b.batchId === batchId) || null;

  const counts = useMemo(() => {
    const c = { ALL: batches.length };
    batches.forEach((b) => { c[b.state] = (c[b.state] || 0) + 1; });
    return c;
  }, [batches]);

  const visibleBatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches.filter((b) =>
      (stateFilter === 'ALL' || b.state === stateFilter) &&
      (!q || [b.batchId, b.cropName, b.originFarm, b.farmerName].some((v) => (v || '').toLowerCase().includes(q)))
    );
  }, [batches, query, stateFilter]);

  const previewWarnings = useMemo(() => {
    if (!batch) return [];
    const w = [];
    if (batch.state === 'SOLD') w.push('This batch is already sold.');
    if (batch.state === 'REGISTERED') w.push("This batch hasn't been dispatched yet (still at the farm gate).");
    const others = (batch.linkedDevices || []).filter((d) => d !== deviceId);
    if (others.length) w.push(`Already monitored by ${others.join(', ')} — both sensors will report.`);
    return w;
  }, [batch, deviceId]);

  const currentBatchOfDevice = device?.assignment?.batchId || null;
  const alreadyLinked = device && batch && currentBatchOfDevice === batch.batchId;

  const link = async () => {
    if (!device || !batch) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiRequest(`/devices/${encodeURIComponent(device.deviceId)}/assign`, {
        method: 'POST',
        body: JSON.stringify({ batch_id: batch.batchId, assigned_by: assignedBy }),
      });
      setResult({ type: 'linked', ...res });
      window.dispatchEvent(new Event('agrichain-data-updated'));
      if (onLinked) onLinked(res);
      load();
    } catch (e) {
      setError(e.message || 'Linking failed');
    } finally {
      setSaving(false);
    }
  };

  const unlink = async () => {
    if (!device) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiRequest(`/devices/${encodeURIComponent(device.deviceId)}/unassign`, {
        method: 'POST',
        body: JSON.stringify({ reason: `unlinked from ${assignedBy}` }),
      });
      setResult({ type: 'unlinked', ...res });
      window.dispatchEvent(new Event('agrichain-data-updated'));
      if (onLinked) onLinked(res);
      load();
    } catch (e) {
      setError(e.message || 'Unlinking failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-[#E6E1D5] shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E6E1D5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#556B2F]/15 flex items-center justify-center">
              <Radio className="w-5 h-5 text-[#556B2F]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#2D2620]">Link IoT Sensor to a Batch</h3>
              <p className="text-xs text-[#666057]">Readings from the sensor are recorded against the batch you pick.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} title="Refresh"
              className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#E6E1D5] cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} title="Close"
              className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:bg-[#E6E1D5] cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5 gap-0 md:divide-x divide-[#E6E1D5]">
          {/* Step 1: sensor */}
          <div className="md:col-span-2 p-5 space-y-3">
            <p className="text-[11px] font-extrabold tracking-wider text-[#8C8275]">1 · CHOOSE SENSOR</p>
            {devices.length === 0 && !loading && (
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-dashed border-[#E6E1D5] text-xs text-[#666057] leading-relaxed">
                No sensors registered yet. Plug in the ESP32 and start <strong>run_monitor.sh</strong>, or run a simulator with <strong>--virtual</strong>.
              </div>
            )}
            <div className="space-y-2">
              {devices.map((d) => {
                const selected = d.deviceId === deviceId;
                return (
                  <button key={d.deviceId} onClick={() => { setDeviceId(d.deviceId); setResult(null); }}
                    className={`w-full text-left p-3 rounded-2xl border transition-colors cursor-pointer ${
                      selected ? 'border-[#556B2F] bg-[#556B2F]/10' : 'border-[#E6E1D5] bg-white hover:bg-[#FAF7F0]'
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <Cpu className="w-4 h-4 text-[#2D2620] flex-shrink-0" />
                        <span className="text-xs font-extrabold text-[#2D2620] truncate">{d.label}</span>
                      </span>
                      <KindBadge kind={d.kind} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px]">
                      <span className="font-mono text-[#666057]">{d.deviceId}</span>
                      <span className={`flex items-center gap-1 font-bold ${d.online ? 'text-[#556B2F]' : 'text-[#8C8275]'}`}>
                        {d.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {d.online ? 'Live' : (d.lastSeenSecondsAgo != null ? `Seen ${formatAgo(d.lastSeenSecondsAgo)}` : 'Never seen')}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 text-[#666057]">
                      {d.assignment
                        ? <>Linked to <strong className="text-[#2D2620]">#{d.assignment.batchId}</strong>{d.assignment.batch ? ` · ${d.assignment.batch.cropName}` : ''}</>
                        : <span className="text-amber-800 font-semibold">Not linked</span>}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: batch */}
          <div className="md:col-span-3 p-5 space-y-3">
            <p className="text-[11px] font-extrabold tracking-wider text-[#8C8275]">2 · CHOOSE PRODUCE BATCH</p>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search batch ID, crop, farm or farmer…"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F0] border border-[#E6E1D5] rounded-xl text-xs font-semibold text-[#2D2620] focus:outline-none focus:border-[#556B2F]" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATE_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setStateFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                    stateFilter === f.key ? 'bg-[#2D2620] text-white border-[#2D2620]' : 'bg-white text-[#666057] border-[#E6E1D5] hover:bg-[#FAF7F0]'
                  }`}>
                  {f.label} <span className="opacity-70">{counts[f.key] || 0}</span>
                </button>
              ))}
              <label className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#666057] cursor-pointer">
                <input type="checkbox" checked={showSold} onChange={(e) => setShowSold(e.target.checked)} className="accent-[#556B2F]" />
                Show sold
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {visibleBatches.map((b) => {
                const selected = b.batchId === batchId;
                return (
                  <button key={b.batchId} onClick={() => { setBatchId(b.batchId); setResult(null); }}
                    className={`text-left p-3 rounded-2xl border transition-colors cursor-pointer ${
                      selected ? 'border-[#556B2F] bg-[#556B2F]/10' : 'border-[#E6E1D5] bg-white hover:bg-[#FAF7F0]'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FAF7F0] border border-[#E6E1D5] p-1 flex items-center justify-center flex-shrink-0">
                        {b.image ? <img src={b.image} alt="" className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-[#8C8275]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-[#2D2620] block truncate">#{b.batchId}</span>
                        <span className="text-[11px] text-[#666057] block truncate">{b.cropName} · {b.originFarm?.split('||')[0]}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATE_CHIP[b.state] || STATE_CHIP.REGISTERED}`}>{b.stateLabel}</span>
                      {b.linkedDevices?.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#556B2F] truncate">
                          <Radio className="w-3 h-3" /> {b.linkedDevices.join(', ')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {visibleBatches.length === 0 && !loading && (
                <div className="sm:col-span-2 p-6 text-center text-xs text-[#666057] bg-[#FAF7F0] rounded-2xl border border-dashed border-[#E6E1D5]">
                  No batches match this filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: summary, warnings, actions */}
        <div className="border-t border-[#E6E1D5] px-5 sm:px-6 py-4 space-y-3 bg-[#FAF7F0]/60">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {result && (
            <div className="p-3 rounded-xl bg-[#556B2F]/10 border border-[#556B2F]/30 text-xs text-[#354424] space-y-1">
              <p className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {result.type === 'unlinked'
                  ? `${result.deviceId} unlinked${result.previousBatchId ? ` from #${result.previousBatchId}` : ''}.`
                  : result.changed
                    ? `${result.deviceId} now reports to #${result.assignment?.batchId}.`
                    : `${result.deviceId} was already linked to #${result.assignment?.batchId}.`}
              </p>
              {(result.warnings || []).map((w) => <p key={w} className="text-amber-800">• {w}</p>)}
            </div>
          )}
          {!result && previewWarnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-0.5">
              {previewWarnings.map((w) => <p key={w}>• {w}</p>)}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#666057]">
              {device && batch
                ? <>Link <strong className="text-[#2D2620]">{device.deviceId}</strong> → <strong className="text-[#2D2620]">#{batch.batchId}</strong> ({batch.cropName}, {batch.stateLabel})</>
                : 'Select a sensor and a batch.'}
            </p>
            <div className="flex items-center gap-2">
              {currentBatchOfDevice && (
                <button onClick={unlink} disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-[#E6E1D5] bg-white text-xs font-bold text-[#B85C38] hover:bg-[#FAF7F0] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
                  <Unlink className="w-4 h-4" /> Unlink {device?.deviceId}
                </button>
              )}
              <button onClick={link} disabled={!device || !batch || saving || alreadyLinked}
                className="px-5 py-2.5 rounded-xl bg-[#556B2F] text-white text-xs font-extrabold hover:bg-[#354424] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {alreadyLinked ? 'Already linked' : 'Link sensor'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function formatAgo(seconds) {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
