import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, X, Clock, Inbox } from 'lucide-react';
import { getMode } from '../data/modes.js';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

// The shared list of history entries, reused by both the desktop column and the
// mobile drawer.
function HistoryList({ items, activeId, onSelect, onDelete, onClear }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-brand-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">History</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-slate-400 transition hover:text-rose-500"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-slate-500">
            <Inbox size={28} />
            <p className="text-xs">No summaries yet.<br />Your history will show up here.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const m = getMode(item.mode);
              const Icon = m.icon;
              const isActive = item.id === activeId;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelect(item)}
                  className={`group cursor-pointer rounded-xl border p-3 transition ${
                    isActive
                      ? 'border-brand-300 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/10'
                      : 'border-slate-200 bg-white/60 hover:border-brand-200 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${m.accent} text-white`}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {item.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="shrink-0 text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                      aria-label="Delete history item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-9 text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{m.short}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {timeAgo(item.date)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function HistorySidebar({
  items,
  activeId,
  onSelect,
  onDelete,
  onClear,
  isOpen,
  onClose,
}) {
  const select = (item) => {
    onSelect(item);
    onClose?.();
  };

  return (
    <>
      {/* Desktop: persistent column */}
      <aside className="glass hidden h-[calc(100vh-7rem)] w-full p-4 lg:block">
        <HistoryList
          items={items}
          activeId={activeId}
          onSelect={onSelect}
          onDelete={onDelete}
          onClear={onClear}
        />
      </aside>

      {/* Mobile / tablet: slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white p-4 shadow-2xl dark:bg-slate-950 lg:hidden"
            >
              <div className="mb-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label="Close history"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="h-[calc(100%-3rem)]">
                <HistoryList
                  items={items}
                  activeId={activeId}
                  onSelect={select}
                  onDelete={onDelete}
                  onClear={onClear}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
