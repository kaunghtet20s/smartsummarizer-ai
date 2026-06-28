// Local history persistence using localStorage. Each entry stores enough to
// reload the full result later (input text, options, output and token usage).

const HISTORY_KEY = 'smartsummarizer.history.v1';
const THEME_KEY = 'smartsummarizer.theme';
const MAX_ITEMS = 50;

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function loadHistory() {
  return safeParse(localStorage.getItem(HISTORY_KEY), []);
}

export function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

/** Build a short, human-friendly title from the source text. */
export function makeTitle(text = '') {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Untitled summary';
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0];
  const base = firstSentence.length <= 60 ? firstSentence : clean;
  return base.length > 60 ? base.slice(0, 57).trimEnd() + '…' : base;
}

/** Add an entry to the front of history and persist it. Returns the new list. */
export function addHistoryItem(entry) {
  const items = loadHistory();
  const withId = {
    id: crypto.randomUUID(),
    date: Date.now(),
    ...entry,
  };
  const next = [withId, ...items];
  saveHistory(next);
  return next;
}

export function deleteHistoryItem(id) {
  const next = loadHistory().filter((item) => item.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory() {
  saveHistory([]);
  return [];
}

// --- Theme ----------------------------------------------------------------
export function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
