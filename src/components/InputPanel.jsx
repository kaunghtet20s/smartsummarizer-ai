import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Trash2,
  UploadCloud,
  FileText,
  Square,
  Lightbulb,
} from 'lucide-react';
import { getMode } from '../data/modes.js';
import { getSample } from '../data/samples.js';
import { useToast } from './Toast.jsx';

const MAX_CHARS = 60000;

// Lazy-load pdf.js only when a PDF is actually dropped, so it doesn't bloat the
// initial bundle. The worker is wired up via Vite's `?url` import.
async function extractPdfText(file) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n\n';
  }
  return text.trim();
}

export default function InputPanel({
  mode,
  text,
  onTextChange,
  onGenerate,
  onClear,
  isGenerating,
  onStop,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const toast = useToast();
  const info = getMode(mode);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTxt =
      file.type.startsWith('text/') || /\.(txt|md|csv|srt|vtt)$/i.test(file.name);

    if (!isPdf && !isTxt) {
      toast('Unsupported file. Please upload a PDF or text file.', 'error');
      return;
    }

    try {
      setParsing(true);
      const extracted = isPdf ? await extractPdfText(file) : await file.text();
      if (!extracted.trim()) {
        toast('Could not read any text from that file.', 'error');
        return;
      }
      onTextChange(extracted.slice(0, MAX_CHARS));
      toast(`Loaded "${file.name}" (${extracted.length.toLocaleString()} chars)`, 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to read the file. It may be scanned or corrupted.', 'error');
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const loadSample = () => {
    const sample = getSample(mode);
    if (!sample) return;
    onTextChange(sample);
    toast('Sample text loaded — hit generate to try it', 'info');
  };

  const charCount = text.length;
  const nearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="glass flex flex-col gap-4 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{info.help}</p>
      </div>

      {/* Drop zone wraps the textarea so users can drop files anywhere on it */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className="relative"
      >
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder={info.placeholder}
          spellCheck={false}
          className="h-64 w-full resize-y rounded-xl border border-slate-200 bg-white/70 p-4 text-[15px] leading-relaxed text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-500/30 sm:h-72"
        />

        <AnimatePresence>
          {(dragActive || parsing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center rounded-xl border-2 border-dashed border-brand-400 bg-brand-50/80 backdrop-blur-sm dark:bg-brand-900/40"
            >
              <div className="flex flex-col items-center gap-2 text-brand-700 dark:text-brand-200">
                {parsing ? (
                  <>
                    <Loader2 className="animate-spin" size={28} />
                    <span className="text-sm font-semibold">Extracting text…</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={28} />
                    <span className="text-sm font-semibold">Drop your PDF or text file</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toolbar: upload, char count, clear */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 shadow-soft transition hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-brand-300"
          >
            <FileText size={14} /> Upload PDF / TXT
          </button>
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 shadow-soft transition hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-brand-300"
          >
            <Lightbulb size={14} /> Load sample
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.srt,.vtt,text/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span
            className={`text-xs font-medium ${
              nearLimit ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>

        <button
          onClick={onClear}
          disabled={!text || isGenerating}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400"
        >
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Generate / Stop */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {isGenerating ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onStop}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-rose-600"
          >
            <Square size={16} fill="currentColor" /> Stop generating
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={onGenerate}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:from-brand-600 hover:to-brand-700"
          >
            <Sparkles size={16} /> {info.cta || 'Generate'}
          </motion.button>
        )}
        <span className="text-center text-xs text-slate-400 dark:text-slate-500 sm:text-left">
          or press{' '}
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold dark:border-white/10 dark:bg-white/10">
            Ctrl
          </kbd>{' '}
          +{' '}
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold dark:border-white/10 dark:bg-white/10">
            Enter
          </kbd>
        </span>
      </div>
    </motion.div>
  );
}
