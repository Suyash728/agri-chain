import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export const DATE_PRESETS = [
  { id: 'today', label: 'Today', sublabel: '24 Oct 2026' },
  { id: 'this-week', label: 'This Week', sublabel: 'Current 7 Days' },
  { id: 'this-month', label: 'This Month', sublabel: 'October 2026' },
  { id: 'last-month', label: 'Last Month', sublabel: 'September 2026' },
  { id: 'this-year', label: 'This Year', sublabel: 'FY 2026-27' },
];

export const DateRangePicker = ({ initialPeriod = 'today', onDateChange, className = '' }) => {
  const [selectedId, setSelectedId] = useState(() => {
    try {
      return localStorage.getItem('agrichain_selected_date_period') || initialPeriod;
    } catch {
      return initialPeriod;
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  const activePreset = DATE_PRESETS.find(p => p.id === selectedId) || DATE_PRESETS[0];

  const handleSelect = (preset) => {
    setSelectedId(preset.id);
    setIsOpen(false);
    try {
      localStorage.setItem('agrichain_selected_date_period', preset.id);
    } catch {}

    if (onDateChange) {
      onDateChange(preset);
    }

    window.dispatchEvent(new CustomEvent('agrichain-date-range-changed', {
      detail: { presetId: preset.id, label: preset.label }
    }));
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.date-range-picker-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const displayLabel = selectedId === 'today'
    ? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : activePreset.label;

  return (
    <div className={`relative date-range-picker-container ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E6E1D5] shadow-xs text-xs font-bold text-[#2D2620] hover:bg-[#FAF7F0] transition-colors cursor-pointer select-none"
        title="Change Reporting Period / Date"
      >
        <span>{displayLabel}</span>
        <Calendar className="w-4 h-4 text-[#556B2F]" />
        <ChevronDown className={`w-3.5 h-3.5 text-[#666057] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[#E6E1D5] shadow-xl py-2 z-50 animate-scale-in">
          <div className="px-3 py-1.5 border-b border-[#E6E1D5]/60 mb-1">
            <span className="text-[10px] font-extrabold text-[#8C8275] uppercase tracking-wider block">
              Reporting Time Period
            </span>
          </div>

          {DATE_PRESETS.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#FAF7F0] text-[#354424] font-black' : 'text-[#2D2620] hover:bg-[#FAF7F0]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-extrabold">{p.label}</span>
                  <span className="text-[10px] text-[#666057] font-semibold">{p.sublabel}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#354424]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
