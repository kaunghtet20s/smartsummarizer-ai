import { motion } from 'framer-motion';
import { MODE_GROUPS, getModesByGroup } from '../data/modes.js';

// Tab bar for switching the active mode. Modes are shown in two labeled groups
// (Summarize / Writing Tools). The selected pill animates between any tab via a
// shared layoutId. `id="features"` makes the header "Features" link scroll here.
export default function ModeTabs({ active, onChange }) {
  return (
    <div id="features" className="glass scroll-mt-24 space-y-3 p-3">
      {MODE_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {getModesByGroup(group.id).map((mode) => {
              const Icon = mode.icon;
              const isActive = active === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onChange(mode.id)}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors min-w-[6.5rem] ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-mode-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${mode.accent} shadow-soft`}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon size={16} />
                    <span className="hidden sm:inline">{mode.label}</span>
                    <span className="sm:hidden">{mode.short}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
