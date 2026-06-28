import { motion } from 'framer-motion';
import { Sparkles, History, Github } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

// Top navigation bar: logo, links, history toggle (mobile) and theme switch.
export default function Header({ theme, onToggleTheme, onOpenHistory }) {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-soft"
          >
            <Sparkles size={20} />
          </motion.div>
          <div className="leading-tight">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              SmartSummarizer <span className="text-brand-600 dark:text-brand-400">AI</span>
            </h1>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              YouTube · Documents · Articles · Reviews
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a className="transition-colors hover:text-brand-600 dark:hover:text-brand-300" href="#app">
            Summarizer
          </a>
          <a className="transition-colors hover:text-brand-600 dark:hover:text-brand-300" href="#features">
            Features
          </a>
          <a
            className="flex items-center gap-1.5 transition-colors hover:text-brand-600 dark:hover:text-brand-300"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} /> GitHub
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onOpenHistory}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/70 text-slate-600 shadow-soft transition-colors hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-brand-300 lg:hidden"
            aria-label="Open history"
            title="History"
          >
            <History size={18} />
          </motion.button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </motion.header>
  );
}
