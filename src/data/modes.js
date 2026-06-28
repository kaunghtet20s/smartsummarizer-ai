import {
  Youtube,
  FileText,
  Newspaper,
  Star,
  SpellCheck,
  Repeat2,
  Wand2,
  ScanSearch,
} from 'lucide-react';

// Modes are grouped into two families shown as labeled rows in the tab bar.
export const MODE_GROUPS = [
  { id: 'summarize', label: 'Summarize' },
  { id: 'tools', label: 'Writing Tools' },
];

// Each mode adjusts the prompt style and the placeholder/help copy.
// `id` is also used by the backend (buildPrompt) to pick the right instructions.
export const MODES = [
  // --- Summarize family ----------------------------------------------------
  {
    id: 'youtube',
    group: 'summarize',
    label: 'YouTube Summary',
    short: 'YouTube',
    icon: Youtube,
    accent: 'from-red-500 to-rose-500',
    cta: 'Generate Summary',
    placeholder:
      'Paste a YouTube transcript here (with or without timestamps)…\n\nTip: open a video → "..." → Show transcript → copy everything.',
    help: 'Turns a raw transcript into a clean video summary with key ideas, takeaways and timestamps.',
  },
  {
    id: 'document',
    group: 'summarize',
    label: 'Document Summary',
    short: 'Document',
    icon: FileText,
    accent: 'from-sky-500 to-blue-600',
    cta: 'Generate Summary',
    placeholder: 'Paste document text here, or drop a .pdf / .txt file below…',
    help: 'Condenses long documents into an overview, key sections, findings and study notes.',
  },
  {
    id: 'article',
    group: 'summarize',
    label: 'Article Summary',
    short: 'Article',
    icon: Newspaper,
    accent: 'from-emerald-500 to-teal-600',
    cta: 'Generate Summary',
    placeholder: 'Paste the full article text here…',
    help: 'Extracts the main argument, supporting evidence and conclusion of an article.',
  },
  {
    id: 'review',
    group: 'summarize',
    label: 'Review Analyzer',
    short: 'Reviews',
    icon: Star,
    accent: 'from-amber-500 to-orange-600',
    cta: 'Analyze Reviews',
    placeholder:
      'Paste one or many product reviews here…\n\nWorks best with several reviews pasted together.',
    help: 'Analyzes sentiment, pros/cons, red flags and gives a buying recommendation.',
  },

  // --- Writing Tools family ------------------------------------------------
  {
    id: 'grammar',
    group: 'tools',
    label: 'Grammar Check',
    short: 'Grammar',
    icon: SpellCheck,
    accent: 'from-green-500 to-emerald-600',
    cta: 'Check Grammar',
    placeholder: 'Paste the text you want proofread for grammar, spelling and punctuation…',
    help: 'Fixes grammar, spelling and punctuation and lists every change it made.',
  },
  {
    id: 'paraphrase',
    group: 'tools',
    label: 'Paraphrase',
    short: 'Paraphrase',
    icon: Repeat2,
    accent: 'from-violet-500 to-purple-600',
    cta: 'Paraphrase',
    placeholder: 'Paste the text you want reworded while keeping the same meaning…',
    help: 'Rewrites your text with fresh wording and structure, plus an alternative version.',
  },
  {
    id: 'humanize',
    group: 'tools',
    label: 'Humanize',
    short: 'Humanize',
    icon: Wand2,
    accent: 'from-pink-500 to-rose-600',
    cta: 'Humanize Text',
    placeholder: 'Paste robotic or AI-sounding text to make it read naturally…',
    help: 'Rewrites stiff or AI-sounding text so it reads like a real, natural human wrote it.',
  },
  {
    id: 'aicheck',
    group: 'tools',
    label: 'AI Check',
    short: 'AI Check',
    icon: ScanSearch,
    accent: 'from-cyan-500 to-sky-600',
    cta: 'Analyze Text',
    placeholder: 'Paste text to estimate how likely it was written by AI…',
    help: 'Estimates an AI-likelihood score with the signals it detected (probabilistic, not definitive).',
  },
];

export const LENGTHS = [
  { id: 'short', label: 'Short', hint: '~3–4 lines' },
  { id: 'medium', label: 'Medium', hint: 'balanced' },
  { id: 'detailed', label: 'Detailed', hint: 'in-depth' },
];

export const STYLES = [
  { id: 'bullets', label: 'Bullet points' },
  { id: 'paragraph', label: 'Paragraph' },
  { id: 'study', label: 'Study notes' },
  { id: 'executive', label: 'Executive summary' },
];

export const TONES = [
  { id: 'simple', label: 'Simple' },
  { id: 'professional', label: 'Professional' },
  { id: 'academic', label: 'Academic' },
];

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Burmese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Portuguese',
  'Russian',
];

export const getMode = (id) => MODES.find((m) => m.id === id) || MODES[0];

export const getModesByGroup = (groupId) => MODES.filter((m) => m.group === groupId);
