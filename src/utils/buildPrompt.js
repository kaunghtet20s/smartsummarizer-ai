// ---------------------------------------------------------------------------
// buildPrompt — pure, dependency-free prompt builder.
//
// This file is the single source of truth for prompt construction. It lives in
// src/utils so it ships with the frontend code, but it imports nothing from the
// browser, so the backend route imports the SAME function (see
// server/routes/generate.js) instead of duplicating the logic.
// ---------------------------------------------------------------------------

const LENGTH_RULES = {
  short: 'Keep it very concise — roughly 3–5 sentences or 4–6 bullet points. Only the essentials.',
  medium: 'Use a balanced length — enough to cover the main points without padding.',
  detailed: 'Be thorough and in-depth. Cover all important nuances, examples and supporting detail.',
};

const STYLE_RULES = {
  bullets: 'Format the answer primarily as clear, scannable bullet points grouped under short bold headings.',
  paragraph: 'Format the answer as well-structured flowing paragraphs (no bullet lists unless truly necessary).',
  study: 'Format the answer as study notes: short bold topic headings followed by tight bullet points, definitions and "Remember:" callouts.',
  executive: 'Format the answer as an executive summary: a 2–3 sentence overview first, then a few high-signal bullets a busy decision-maker can skim.',
};

const TONE_RULES = {
  simple: 'Use simple, plain language anyone can understand. Avoid jargon.',
  professional: 'Use a clear, polished, professional tone.',
  academic: 'Use a precise, formal, academic tone with accurate terminology.',
};

// Mode-specific structure. Each returns the body of instructions describing
// exactly which sections the model should produce.
const MODE_RULES = {
  youtube: `You are summarizing a YOUTUBE VIDEO TRANSCRIPT.
Produce these sections (use markdown headings):
- **Video Summary** — a short paragraph describing what the video covers.
- **Main Ideas** — the core ideas/topics discussed.
- **Key Timestamps** — ONLY if timestamps (e.g. 12:34) appear in the transcript, list the important ones as "12:34 — what happens". If no timestamps exist, write "No timestamps detected in the transcript." and skip this list.
- **Important Takeaways** — the most valuable points to remember.
- **Actionable Lessons** — concrete things the viewer can apply.`,

  document: `You are summarizing a DOCUMENT.
Produce these sections (use markdown headings):
- **Overview** — a short high-level summary.
- **Key Sections** — the document's structure / main parts.
- **Important Findings** — notable facts, data or results.
- **Main Arguments** — the central claims and reasoning.
- **Conclusion** — how the document wraps up.
- **Study Notes** — tight bullet notes a student could revise from.`,

  article: `You are summarizing an ARTICLE.
Produce these sections (use markdown headings):
- **Summary** — what the article is about in a few sentences.
- **Main Argument** — the central thesis the author is making.
- **Supporting Evidence** — the key facts, examples or data used to back it up.
- **Key Points** — other notable points.
- **Conclusion / Takeaway** — the final message for the reader.`,

  review: `You are an expert PRODUCT REVIEW ANALYST. Analyze the customer review(s).
Produce these sections (use markdown headings):
- **Sentiment Score:** output a single line exactly in the form "**Sentiment Score:** N/100" where N is an integer 0–100 reflecting overall positivity. This line MUST be the first line of your answer.
- **Overall Sentiment** — Positive / Mixed / Negative, with a one-line explanation.
- **Common Positive Points** — recurring praise.
- **Common Negative Points** — recurring complaints.
- **Red Flags** — anything concerning (defects, safety, fake-review signals). Write "None obvious" if there are none.
- **Buying Recommendation** — who should buy it and who should not.
- **Final Verdict** — a one-sentence bottom line.`,

  grammar: `You are a meticulous GRAMMAR, SPELLING & PUNCTUATION checker.
Fix the user's text without changing its meaning, voice or formatting.
Produce these sections (use markdown headings):
- **Corrected Text** — the full text with every grammar, spelling and punctuation error fixed. If it is already correct, repeat it and say so.
- **Changes Made** — a bullet list of each fix as "original → corrected — short reason". If nothing needed fixing, write "No changes needed.".
Only correct errors — do NOT rephrase for style or shorten the text.`,

  paraphrase: `You are an expert PARAPHRASER.
Rewrite the user's text to express the SAME meaning with different wording and sentence structure, staying roughly the same length and reading naturally. Do not copy long phrases verbatim.
Produce these sections (use markdown headings):
- **Paraphrased Text** — the rewritten version, ready to use.
- **Alternative Version** — one more distinct rewrite for variety.`,

  humanize: `You are an expert HUMANIZER that makes robotic or AI-generated text sound natural and human.
Rewrite the user's text so it reads as if written by a thoughtful person: vary sentence length, use natural transitions and contractions, and keep an authentic voice — while preserving the original meaning and facts. Avoid clichés and obvious "AI" phrasing.
Produce these sections (use markdown headings):
- **Humanized Text** — the rewritten, natural-sounding version.
- **What Changed** — a few bullets on how it was made more human.`,

  aicheck: `You are an AI-CONTENT DETECTOR estimating how likely the user's text was written by AI.
Produce these sections (use markdown headings):
- **AI Likelihood Score:** the FIRST line must be exactly "**AI Likelihood Score:** N/100" where N (0–100) is the estimated probability the text is AI-generated.
- **Verdict** — "Likely AI-generated", "Likely human-written", or "Mixed / Uncertain", with one line of reasoning.
- **Signals Detected** — concrete cues (repetitive structure, generic phrasing, uniform sentence length, etc.).
- **Human Indicators** — anything suggesting a human author.
- **Note** — remind the reader that automated AI detection is probabilistic and not definitive.`,
};

// Modes that take the summary length/style options. Everything else is a
// "writing tool" that only honors tone + language.
const SUMMARY_MODES = new Set(['youtube', 'document', 'article', 'review']);

/** Minimum input length per mode (tools accept much shorter input). */
export function getMinChars(mode) {
  return SUMMARY_MODES.has(mode) ? 40 : 12;
}

/**
 * Build the system + user messages for a summarization request.
 * @param {{mode:string,text:string,length:string,style:string,tone:string,language:string}} opts
 * @returns {{system:string,user:string}}
 */
export function buildPrompt({
  mode = 'document',
  text = '',
  length = 'medium',
  style = 'bullets',
  tone = 'professional',
  language = 'English',
} = {}) {
  const isSummary = SUMMARY_MODES.has(mode);
  const modeRules = MODE_RULES[mode] || MODE_RULES.document;
  const toneRule = TONE_RULES[tone] || TONE_RULES.professional;

  const intro = isSummary
    ? 'You are SmartSummarizer AI, an expert assistant that turns long content into clean, useful, well-structured summaries.'
    : 'You are SmartSummarizer AI, an expert writing assistant.';

  const lines = [intro, modeRules, '', 'Global rules:'];

  // Length & output style only apply to summary-style modes.
  if (isSummary) {
    lines.push(`- Length: ${LENGTH_RULES[length] || LENGTH_RULES.medium}`);
    lines.push(`- Output style: ${STYLE_RULES[style] || STYLE_RULES.bullets}`);
  }

  lines.push(
    `- Tone: ${toneRule}`,
    `- Write the entire response in ${language}.`,
    '- Use clean GitHub-flavored Markdown (headings, bold, bullet lists).',
    '- Be faithful to the source. Never invent facts that are not supported by the content.',
    '- Do not add any preamble like "Sure" or "Here is" — start directly with the result.'
  );

  const system = lines.join('\n');
  const user = `Here is the content:\n\n"""\n${text.trim()}\n"""`;

  return { system, user };
}

export default buildPrompt;
