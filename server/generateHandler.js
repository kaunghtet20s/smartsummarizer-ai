// Framework-agnostic request handler for POST /api/generate.
//
// It only uses the standard Node (req, res) interface, so the SAME function
// powers both the local Express server (server/routes/generate.js) and the
// Vercel serverless function (api/generate.js) — no duplicated logic.

import { buildPrompt, getMinChars } from '../src/utils/buildPrompt.js';
import {
  callAI,
  parseAIStream,
  getProviderConfig,
  friendlyProviderError,
} from './utils/aiClient.js';

const VALID_MODES = [
  'youtube',
  'document',
  'article',
  'review',
  'grammar',
  'paraphrase',
  'humanize',
  'aicheck',
];
const MAX_CHARS = 100000;

export async function handleGenerate(req, res) {
  const { mode, text, length, style, tone, language } = req.body || {};

  // --- Validation (returned as plain JSON before any streaming) ------------
  if (mode && !VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode.' });
  }
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'No content provided.' });
  }
  const minChars = getMinChars(mode);
  if (text.trim().length < minChars) {
    return res
      .status(400)
      .json({ error: `Input is too short — add at least ${minChars} characters.` });
  }
  if (text.length > MAX_CHARS) {
    return res
      .status(413)
      .json({ error: `Input is too long (max ${MAX_CHARS.toLocaleString()} characters).` });
  }

  const { provider, hasKey } = getProviderConfig();
  if (!hasKey) {
    return res.status(500).json({
      error: `Server is missing the API key for "${provider}". Set it in your environment variables.`,
    });
  }

  const { system, user } = buildPrompt({ mode, text, length, style, tone, language });

  // Abort the upstream request only if the client actually disconnects mid-stream.
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  let providerRes;
  try {
    providerRes = await callAI({ system, user, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') return res.end();
    console.error('Provider request failed:', err);
    return res.status(502).json({ error: 'Could not reach the AI service. Please try again.' });
  }

  // Provider HTTP error → clean JSON (lets the client map 429 etc.).
  if (!providerRes.ok) {
    let bodyText = '';
    try {
      bodyText = await providerRes.text();
    } catch {
      /* ignore */
    }
    console.error(`Provider error ${providerRes.status}:`, bodyText.slice(0, 500));
    return res
      .status(providerRes.status === 429 ? 429 : 502)
      .json({ error: friendlyProviderError(providerRes.status, bodyText) });
  }

  // --- Stream the result as SSE -------------------------------------------
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable proxy buffering (e.g. on Vercel/nginx) so chunks flush immediately.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    for await (const event of parseAIStream(providerRes, provider)) {
      send(event);
    }
    send({ type: 'done' });
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error('Streaming error:', err);
      send({ type: 'error', message: 'The summary was interrupted. Please try again.' });
    }
  } finally {
    res.end();
  }
}

export default handleGenerate;
