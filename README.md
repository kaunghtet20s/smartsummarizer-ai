# 🧠 SmartSummarizer AI

**AI-Powered YouTube Transcript & Document Summarizer**

A premium, portfolio-ready Generative-AI web app that turns long YouTube transcripts, documents, articles, and product reviews into clean, structured summaries. Built with React + Vite + Tailwind + Framer Motion on the frontend and a secure Node/Express backend that streams results from **Google Gemini** or **OpenAI** — your API key never touches the browser.

---

## ✨ Features

- **8 specialized modes in two families** — *Summarize:* YouTube, Document, Article, Review Analyzer · *Writing Tools:* Grammar Check, Paraphrase, Humanize, AI Check. Each one adjusts the AI prompt and the output structure.
- **Score gauges** — sentiment score (Review) and AI-likelihood score (AI Check) render as animated gauges.
- **Real streaming responses** — text appears progressively (Server-Sent Events) with a live typing caret.
- **Summary options** — length (Short / Medium / Detailed), style (Bullets / Paragraph / Study notes / Executive), tone (Simple / Professional / Academic), and 12 output languages.
- **Review Analyzer** — sentiment score gauge, pros/cons, red flags, and a buying recommendation.
- **PDF & TXT upload** — drag-and-drop a file; PDFs are parsed in-browser with `pdf.js`.
- **Export** — copy, download as `.txt`, or **export as PDF** (`jsPDF`).
- **Token usage display** — prompt / completion / total tokens per request.
- **Local history** — every summary is saved to `localStorage`; click to reload, delete, or clear all.
- **Polished UX** — light/dark mode, glassmorphism, Framer Motion animations, toast notifications, skeleton loaders, and a `Ctrl/⌘ + Enter` shortcut.
- **Fully responsive** — the history sidebar becomes a slide-in drawer on mobile.
- **Secure by design** — the AI key lives only in the server's environment; the frontend calls a relative `/api/generate` route.

---

## 🧩 Tech Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, react-markdown |
| Backend  | Node.js, Express, native `fetch` streaming |
| AI       | Google Gemini **or** OpenAI |
| Extras   | pdf.js (PDF parsing), jsPDF (PDF export) |

---

## 📁 Folder Structure

```
.
├─ index.html
├─ vite.config.js          # proxies /api → http://localhost:5000 in dev
├─ tailwind.config.js
├─ .env.example
├─ src/
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ ModeTabs.jsx
│  │  ├─ InputPanel.jsx
│  │  ├─ OptionsPanel.jsx
│  │  ├─ OutputPanel.jsx
│  │  ├─ HistorySidebar.jsx
│  │  ├─ LoadingState.jsx
│  │  ├─ Toast.jsx
│  │  └─ ThemeToggle.jsx
│  ├─ data/modes.js
│  ├─ utils/
│  │  ├─ buildPrompt.js     # single source of truth (also imported by the server)
│  │  ├─ api.js             # SSE streaming client
│  │  └─ storage.js         # localStorage history + theme
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
└─ server/
   ├─ index.js              # Express app
   ├─ routes/generate.js    # POST /api/generate
   └─ utils/aiClient.js     # Gemini/OpenAI streaming
```

---

## 🚀 Getting Started

### 1. Install

```bash
npm install
```

### 2. Create your `.env`

Copy the example and add your key:

```bash
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

**Using Google Gemini (default, free tier):** get a key at <https://aistudio.google.com/app/apikey>

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
```

**Using OpenAI instead:** get a key at <https://platform.openai.com/api-keys>

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=5000
```

> 🔒 The `.env` file is git-ignored and only read by the backend. The key is never bundled into the frontend.

### 3. Run it

Run frontend **and** backend together:

```bash
npm run dev:all
```

…or run them in separate terminals:

```bash
npm run server   # Express API on http://localhost:5000
npm run dev      # Vite app  on http://localhost:5173
```

Open **<http://localhost:5173>**.

---

## 🧪 Testing the App

1. Check the backend is alive: visit <http://localhost:5000/api/health> — you should see `{ "status": "ok", "keyConfigured": true }`.
2. In the app, pick a mode (e.g. **YouTube Summary**).
3. Paste a transcript / article, or drag-and-drop a PDF or `.txt` file.
4. Choose length, style, tone, and language.
5. Hit **Generate Summary** (or `Ctrl/⌘ + Enter`) and watch the result stream in.
6. Try **Copy**, **TXT**, **PDF**, **Regenerate**, and **Clear**.
7. Reload the page — your summary is still in the **History** sidebar.

**Error handling to try:** generate with empty/short input, an invalid key, or stop a request mid-stream — each shows a friendly toast.

---

## 🛠️ API

### `POST /api/generate`

Request body:

```json
{
  "mode": "youtube",
  "text": "…content to summarize…",
  "length": "medium",
  "style": "bullets",
  "tone": "professional",
  "language": "English"
}
```

Response: a `text/event-stream` of SSE events:

```
data: {"type":"chunk","text":"partial text…"}
data: {"type":"usage","usage":{"promptTokens":812,"completionTokens":240,"totalTokens":1052}}
data: {"type":"done"}
```

Validation/provider errors are returned as JSON (`{ "error": "…" }`) with an appropriate status code before streaming begins.

---

## 🏗️ Production Build

```bash
npm run build       # outputs static frontend to dist/
npm run preview     # preview the build locally
```

## ▲ Deploy to Vercel

The repo is Vercel-ready with zero config:

- The **frontend** is built by Vercel's Vite preset (`vite build` → `dist/`).
- The **backend** runs as serverless functions in [`api/`](api/) — `api/generate.js`
  and `api/health.js` reuse the exact same handler/AI client as the local
  Express server, so there's no duplicated logic.

**Steps:**

1. Push the repo to GitHub and import it at <https://vercel.com/new> (or run `vercel`).
2. In **Project → Settings → Environment Variables**, add:

   | Key | Value |
   | --- | --- |
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | *your key* |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |

3. **Redeploy** so the functions pick up the variables.

The frontend calls the relative path `/api/generate`, which maps to the serverless
function in production and is proxied to the Express server in local dev — so the
same code works in both places, and the key only ever lives in the server
environment.

> For a plain Node host instead of Vercel, run `npm run server` (Express) behind
> `dist/` served as static files, with the same environment variables set.

---

## 📄 License

MIT — free to use for your portfolio. Built with ❤️ using React, Vite, Tailwind & Framer Motion.
