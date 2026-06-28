import { motion } from 'framer-motion';
import { Ruler, LayoutList, MessageSquare, Languages } from 'lucide-react';
import { LENGTHS, STYLES, TONES, LANGUAGES } from '../data/modes.js';

// Reusable segmented control for the small option groups.
function Segmented({ label, icon: Icon, options, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon size={13} /> {label}
      </label>
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100/80 p-1 dark:bg-white/5">
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              title={opt.hint || opt.label}
              className={`relative flex-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={`seg-${label}`}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 shadow-soft"
                />
              )}
              <span className="relative">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OptionsPanel({ options, onChange, showSummaryOptions = true }) {
  const set = (key) => (val) => onChange({ ...options, [key]: val });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {showSummaryOptions && (
        <>
          <Segmented
            label="Length"
            icon={Ruler}
            options={LENGTHS}
            value={options.length}
            onChange={set('length')}
          />
          <Segmented
            label="Style"
            icon={LayoutList}
            options={STYLES}
            value={options.style}
            onChange={set('style')}
          />
        </>
      )}
      <Segmented
        label="Tone"
        icon={MessageSquare}
        options={TONES}
        value={options.tone}
        onChange={set('tone')}
      />
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Languages size={13} /> Language
        </label>
        <select
          value={options.language}
          onChange={(e) => set('language')(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:focus:ring-brand-500/30"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
