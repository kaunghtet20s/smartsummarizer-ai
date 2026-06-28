import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import {
  Copy,
  Download,
  FileDown,
  RefreshCw,
  Trash2,
  Sparkles,
  Coins,
  Gauge,
} from 'lucide-react';
import { getMode } from '../data/modes.js';
import LoadingState from './LoadingState.jsx';
import { useToast } from './Toast.jsx';

// Pull a "<label> Score: N/100" value out of the model output.
function parseScore(text, labelRegex) {
  const match = text.match(labelRegex);
  if (!match) return null;
  const score = Math.max(0, Math.min(100, parseInt(match[1], 10)));
  return Number.isNaN(score) ? null : score;
}

// Build the gauge config for modes that emit a 0–100 score (review, aicheck).
function getScoreInfo(mode, text) {
  if (mode === 'review') {
    const score = parseScore(text, /sentiment score[^\d]*(\d{1,3})\s*\/\s*100/i);
    if (score === null) return null;
    const label = score >= 70 ? 'Positive' : score >= 45 ? 'Mixed' : 'Negative';
    const color =
      score >= 70
        ? 'from-emerald-400 to-emerald-600'
        : score >= 45
          ? 'from-amber-400 to-orange-500'
          : 'from-rose-400 to-rose-600';
    return { title: 'Sentiment', label, score, color };
  }
  if (mode === 'aicheck') {
    const score = parseScore(text, /ai likelihood score[^\d]*(\d{1,3})\s*\/\s*100/i);
    if (score === null) return null;
    // High score = more likely AI → flag in red; low = human → green.
    const label = score >= 70 ? 'Likely AI' : score >= 45 ? 'Uncertain' : 'Likely Human';
    const color =
      score >= 70
        ? 'from-rose-400 to-rose-600'
        : score >= 45
          ? 'from-amber-400 to-orange-500'
          : 'from-emerald-400 to-emerald-600';
    return { title: 'AI likelihood', label, score, color };
  }
  return null;
}

function ScoreGauge({ info }) {
  const { title, label, score, color } = info;
  return (
    <div className="glass mb-4 flex items-center gap-4 p-4">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
        <Gauge size={20} />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {title} · {label}
          </span>
          <span className="font-bold text-slate-900 dark:text-white">{score}/100</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${color}`}
          />
        </div>
      </div>
    </div>
  );
}

// One reusable action button.
function ActionButton({ icon: Icon, label, onClick, disabled, danger }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-soft transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-500/20 dark:hover:bg-rose-500/10'
          : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300 dark:hover:text-brand-300'
      }`}
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

export default function OutputPanel({
  mode,
  result,
  isGenerating,
  usage,
  onRegenerate,
  onClear,
  canRegenerate,
}) {
  const toast = useToast();
  const info = getMode(mode);
  const scoreInfo = useMemo(
    () => (result ? getScoreInfo(mode, result) : null),
    [mode, result]
  );

  const hasResult = Boolean(result);
  const showSkeleton = isGenerating && !result;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast('Summary copied to clipboard', 'success');
    } catch {
      toast('Could not copy to clipboard', 'error');
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${mode}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Downloaded .txt file', 'success');
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('SmartSummarizer AI', margin, margin);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`${info.label} · ${new Date().toLocaleString()}`, margin, margin + 16);

      doc.setTextColor(30);
      doc.setFontSize(11);
      // Strip the heaviest markdown markers for a cleaner PDF.
      const plain = result.replace(/[*_`#>]/g, '').replace(/\n{3,}/g, '\n\n');
      const lines = doc.splitTextToSize(plain, maxWidth);

      let y = margin + 44;
      const lineHeight = 16;
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      doc.save(`summary-${mode}-${Date.now()}.pdf`);
      toast('Exported as PDF', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to export PDF', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass flex min-h-[20rem] flex-col p-4 sm:p-5"
    >
      {/* Header + actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Result</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{info.label}</p>
          </div>
        </div>

        {hasResult && (
          <div className="flex flex-wrap items-center gap-1.5">
            <ActionButton icon={Copy} label="Copy" onClick={handleCopy} disabled={isGenerating} />
            <ActionButton icon={Download} label="TXT" onClick={handleDownloadTxt} disabled={isGenerating} />
            <ActionButton icon={FileDown} label="PDF" onClick={handleExportPdf} disabled={isGenerating} />
            <ActionButton
              icon={RefreshCw}
              label="Regenerate"
              onClick={onRegenerate}
              disabled={isGenerating || !canRegenerate}
            />
            <ActionButton icon={Trash2} label="Clear" onClick={onClear} disabled={isGenerating} danger />
          </div>
        )}
      </div>

      {/* Token usage chip */}
      <AnimatePresence>
        {usage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Coins size={13} /> {usage.totalTokens?.toLocaleString() ?? '—'} tokens
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              {usage.promptTokens?.toLocaleString() ?? '—'} in ·{' '}
              {usage.completionTokens?.toLocaleString() ?? '—'} out
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <LoadingState key="loading" />
          ) : hasResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose-result max-w-none"
            >
              {scoreInfo && <ScoreGauge info={scoreInfo} />}
              <div className={isGenerating ? 'typing-caret' : ''}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-3 text-center"
            >
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-600">
                <Sparkles size={28} />
              </div>
              <p className="max-w-xs text-sm text-slate-400 dark:text-slate-500">
                Your AI result will appear here. Paste content, choose your options and hit{' '}
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {info.cta || 'Generate'}
                </span>
                .
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
