import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header.jsx';
import ModeTabs from './components/ModeTabs.jsx';
import InputPanel from './components/InputPanel.jsx';
import OptionsPanel from './components/OptionsPanel.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import HistorySidebar from './components/HistorySidebar.jsx';
import { ToastProvider, useToast } from './components/Toast.jsx';
import { getMode } from './data/modes.js';
import { getMinChars } from './utils/buildPrompt.js';
import { streamSummary } from './utils/api.js';
import {
  loadHistory,
  addHistoryItem,
  deleteHistoryItem,
  clearHistory,
  makeTitle,
  loadTheme,
  saveTheme,
} from './utils/storage.js';

const DEFAULT_OPTIONS = {
  length: 'medium',
  style: 'bullets',
  tone: 'professional',
  language: 'English',
};

function Workspace() {
  const toast = useToast();

  const [theme, setTheme] = useState(loadTheme);
  const [mode, setMode] = useState('youtube');
  const [text, setText] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const [result, setResult] = useState('');
  const [usage, setUsage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const abortRef = useRef(null);
  // Snapshot of the request that produced the current result (for Regenerate).
  const lastRequestRef = useRef(null);

  // --- Theme ---------------------------------------------------------------
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  // --- Load history once ---------------------------------------------------
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // --- Core generation -----------------------------------------------------
  const runGeneration = useCallback(
    async (request) => {
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setResult('');
      setUsage(null);
      setActiveId(null);

      let finalText = '';
      let finalUsage = null;

      try {
        const { text: full, usage: u } = await streamSummary({
          payload: request,
          signal: controller.signal,
          onChunk: (chunk) => setResult((prev) => prev + chunk),
          onUsage: (incoming) => setUsage(incoming),
        });
        finalText = full;
        finalUsage = u;

        if (!finalText.trim()) {
          throw new Error('The AI returned an empty response. Please try again.');
        }

        // Persist to local history.
        const entry = {
          title: makeTitle(request.text),
          mode: request.mode,
          options: {
            length: request.length,
            style: request.style,
            tone: request.tone,
            language: request.language,
          },
          input: request.text,
          result: finalText,
          usage: finalUsage,
        };
        const next = addHistoryItem(entry);
        setHistory(next);
        setActiveId(next[0].id);
        toast('Summary ready and saved to history', 'success');
      } catch (err) {
        if (err?.name === 'AbortError') {
          toast('Generation stopped', 'info');
        } else {
          console.error(err);
          toast(err.message || 'Something went wrong. Please try again.', 'error');
        }
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [toast]
  );

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;

    const trimmed = text.trim();
    if (!trimmed) {
      toast('Please paste some content first.', 'error');
      return;
    }
    const minChars = getMinChars(mode);
    if (trimmed.length < minChars) {
      toast(`Input is too short — add at least ${minChars} characters.`, 'error');
      return;
    }

    const request = { mode, text: trimmed, ...options };
    lastRequestRef.current = request;
    runGeneration(request);
  }, [isGenerating, text, mode, options, runGeneration, toast]);

  const handleStop = () => abortRef.current?.abort();

  const handleRegenerate = () => {
    if (isGenerating) return;
    const req = lastRequestRef.current;
    if (!req) {
      toast('Nothing to regenerate yet.', 'info');
      return;
    }
    runGeneration(req);
  };

  const handleClearInput = () => {
    setText('');
    toast('Input cleared', 'info');
  };

  const handleClearResult = () => {
    setResult('');
    setUsage(null);
    setActiveId(null);
  };

  // --- Keyboard shortcut: Ctrl/Cmd + Enter ---------------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGenerate]);

  // --- History actions -----------------------------------------------------
  const handleSelectHistory = (item) => {
    setMode(item.mode);
    setText(item.input);
    setOptions({ ...DEFAULT_OPTIONS, ...item.options });
    setResult(item.result);
    setUsage(item.usage || null);
    setActiveId(item.id);
    lastRequestRef.current = {
      mode: item.mode,
      text: item.input,
      ...{ ...DEFAULT_OPTIONS, ...item.options },
    };
    toast('Loaded from history', 'info');
  };

  const handleDeleteHistory = (id) => {
    setHistory(deleteHistoryItem(id));
    if (id === activeId) setActiveId(null);
    toast('History item deleted', 'info');
  };

  const handleClearHistory = () => {
    setHistory(clearHistory());
    setActiveId(null);
    toast('History cleared', 'info');
  };

  const activeMode = getMode(mode);
  const isSummaryMode = activeMode.group === 'summarize';

  return (
    <div className="app-bg min-h-screen">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <main id="app" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
          {/* Main column */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-1"
            >
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {isSummaryMode ? 'Summarize anything in seconds' : 'Perfect your writing in seconds'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{activeMode.help}</p>
            </motion.div>

            <ModeTabs active={mode} onChange={setMode} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <InputPanel
                  mode={mode}
                  text={text}
                  onTextChange={setText}
                  onGenerate={handleGenerate}
                  onClear={handleClearInput}
                  isGenerating={isGenerating}
                  onStop={handleStop}
                />
                <div className="glass p-4 sm:p-5">
                  <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                    {isSummaryMode ? 'Summary options' : 'Options'}
                  </h3>
                  <OptionsPanel
                    options={options}
                    onChange={setOptions}
                    showSummaryOptions={isSummaryMode}
                  />
                </div>
              </div>

              <OutputPanel
                mode={mode}
                result={result}
                isGenerating={isGenerating}
                usage={usage}
                onRegenerate={handleRegenerate}
                onClear={handleClearResult}
                canRegenerate={Boolean(lastRequestRef.current)}
              />
            </div>
          </div>

          {/* History column / drawer */}
          <HistorySidebar
            items={history}
            activeId={activeId}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            onClear={handleClearHistory}
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
          />
        </div>

        <footer className="mt-10 border-t border-slate-200/60 pt-6 text-center text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">
          SmartSummarizer AI · Built with React, Vite, Tailwind & Framer Motion · Your API key stays
          on the server.
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Workspace />
    </ToastProvider>
  );
}
