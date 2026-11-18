import React, { useCallback, useEffect, useState } from 'react';
import { Radio, Thermometer, Droplets, Activity, ShieldCheck, ShieldAlert, MapPin, Link2, Clock, Cpu } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { IoTLinkModal, KindBadge, formatAgo } from './IoTLinkModal';

const POLL_MS = 5000;

function agoFromIso(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 1000));
}

const Metric = ({ icon: Icon, label, value, tone = 'text-[#2D2620]' }) => (
  <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5]/60">
    <p className="text-[10px] text-[#666057] font-semibold flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
    <span className={`text-xs font-extrabold block mt-0.5 truncate ${tone}`}>{value}</span>
  </div>
);

/**
 * Live sensor panel for one batch: which device is linked, its latest crate reading, and a
 * button to link / change the sensor. Polls every 5 s while mounted.
 */
export const IoTSensorCard = ({ batchId, title = 'IoT Crate Sensor', assignedBy = 'web' }) => {
  const [view, setView] = useState(null);
  const [failed, setFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(() => {
    if (!batchId) return;
    apiRequest(`/batches/${encodeURIComponent(batchId)}/iot`, {}, 8000)
      .then((data) => { setView(data); setFailed(false); })
      .catch(() => setFailed(true));
  }, [batchId]);

  useEffect(() => {
    setView(null);
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener('agrichain-data-updated', load);
    window.addEventListener('agrichain-data-reset', load);
    return () => {
      clearInterval(timer);
      window.removeEventListener('agrichain-data-updated', load);
      window.removeEventListener('agrichain-data-reset', load);
    };
  }, [load]);

  if (!batchId) return null;

  const latest = view?.latest;
  const linked = view?.linked;
  const live = view?.live;
  const readingAgo = latest ? agoFromIso(latest.measuredAt || latest.receivedAt) : null;

  let pill = { text: 'No sensor', cls: 'bg-gray-100 text-gray-700' };
  if (linked && live) pill = { text: 'Live', cls: 'bg-[#556B2F]/15 text-[#556B2F]' };
  else if (linked) pill = { text: 'Linked · offline', cls: 'bg-amber-100 text-amber-900' };
  else if (latest) pill = { text: 'Past readings only', cls: 'bg-gray-100 text-gray-700' };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E6E1D5] shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#556B2F]/15 flex items-center justify-center flex-shrink-0">
            <Radio className={`w-4 h-4 text-[#556B2F] ${live ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[#2D2620] truncate">{title}</p>
            <p className="text-[11px] text-[#666057] truncate">Batch #{batchId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${pill.cls}`}>{pill.text}</span>
          <button onClick={() => setPickerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#556B2F] text-white text-[11px] font-extrabold hover:bg-[#354424] flex items-center gap-1 cursor-pointer">
            <Link2 className="w-3.5 h-3.5" /> {linked ? 'Change' : 'Link sensor'}
          </button>
        </div>
      </div>

      {failed && !view && <p className="text-[11px] text-[#8C8275]">Sensor service unreachable.</p>}

      {view && (view.devices || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {view.devices.map((d) => (
            <span key={d.deviceId} className="px-2 py-1 rounded-lg bg-[#FAF7F0] border border-[#E6E1D5] text-[11px] font-bold text-[#2D2620] flex items-center gap-1.5">
              <Cpu className="w-3 h-3" /> {d.deviceId} <KindBadge kind={d.kind} />
              <span className={`w-1.5 h-1.5 rounded-full ${d.online ? 'bg-[#556B2F]' : 'bg-[#8C8275]'}`} />
            </span>
          ))}
        </div>
      )}

      {latest ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Metric icon={Thermometer} label="Crate temp" tone="text-[#2B6CB0]"
              value={latest.tempC != null ? `${Number(latest.tempC).toFixed(1)}°C (${Math.round(latest.tempC * 10)} deci-°C)` : '—'} />
            <Metric icon={Droplets} label="Humidity" value={latest.humidityPct != null ? `${Number(latest.humidityPct).toFixed(1)}% RH` : '—'} />
            <Metric icon={Activity} label="Impacts (recent)"
              tone={view.shockEvents > 0 ? 'text-[#B85C38]' : 'text-[#556B2F]'}
              value={view.shockEvents > 0 ? `${view.shockEvents} shock event(s)` : 'None'} />
            <Metric icon={latest.tamper ? ShieldAlert : ShieldCheck} label="Lid seal"
              tone={latest.tamper ? 'text-red-700' : 'text-[#556B2F]'}
              value={latest.tamper == null ? '—' : (latest.tamper ? 'OPENED' : 'Sealed')} />
            <Metric icon={MapPin} label="GPS"
              value={view.lastFix ? `${Number(view.lastFix.latitude).toFixed(4)}, ${Number(view.lastFix.longitude).toFixed(4)}` : 'No fix yet'} />
            <Metric icon={Clock} label="Last reading"
              value={`${readingAgo != null ? formatAgo(readingAgo) : '—'} · ${latest.deviceId}`} />
          </div>
          {latest.verdict && (
            <p className="text-[11px] text-[#666057]">
              AI trust verdict on last reading: <strong className={latest.verdict === 'VALID' ? 'text-[#556B2F]' : 'text-[#B85C38]'}>{latest.verdict}</strong>
              {latest.source ? ` · source: ${latest.source}` : ''}
            </p>
          )}
        </>
      ) : view && (
        <p className="text-[11px] text-[#666057] p-3 rounded-xl bg-[#FAF7F0] border border-dashed border-[#E6E1D5]">
          {linked
            ? 'Sensor linked — waiting for its first reading (plug in the ESP32 or run a simulator in virtual mode).'
            : 'No sensor is linked to this batch yet. Link one to stream crate temperature, impacts, lid seal and GPS here.'}
        </p>
      )}

      <IoTLinkModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} initialBatchId={batchId}
        assignedBy={assignedBy} onLinked={load} />
    </div>
  );
};
