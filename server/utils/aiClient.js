// ---------------------------------------------------------------------------
// Provider-agnostic streaming AI client.
//
// Supports Google Gemini (default) and OpenAI. Uses the native `fetch` (Node 18+)
// so there are no SDK dependencies. The API key is read from the environment and
// NEVER leaves the server.
// ---------------------------------------------------------------------------

/** Resolve the active provider + model from environment variables. */
export function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  if (provider === 'openai') {
    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      hasKey: Boolean(process.env.OPENAI_API_KEY),
    };
  }

  return {
    provider: 'gemini',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  };
}

/**
 * Fire the streaming request at the provider and return the raw `Response`.
 * The caller inspects `response.ok` to decide between a clean JSON error and an
 * SSE stream.
 */
export async function callAI({ system, user, signal }) {
  const { provider, model } = getProviderConfig();
  return provider === 'openai'
    ? callOpenAI({ model, system, user, signal })
    : callGemini({ model, system, user, signal });
}

function callGemini({ model, system, user, signal }) {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        // Disable "thinking" so summary tokens start streaming immediately and
        // we don't pay for hidden reasoning tokens. (Supported by 2.5 Flash.)
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
}

function callOpenAI({ model, system, user, signal }) {
  const key = process.env.OPENAI_API_KEY;
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    signal,
    body: JSON.stringify({
      model,
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
}

// --- SSE parsing -----------------------------------------------------------

// Pull every JSON payload out of one SSE event block. Tolerant of `\r\n` and
// `\n` line endings (Gemini uses CRLF, OpenAI uses LF).
function* parseEventBlock(block) {
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      yield JSON.parse(payload);
    } catch {
      /* ignore malformed / partial keep-alive lines */
    }
  }
}

/** Generic async generator that yields parsed JSON objects from an SSE body. */
async function* sseObjects(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Events are separated by a blank line — tolerate CRLF and LF.
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() ?? '';
    for (const part of parts) yield* parseEventBlock(part);
  }

  // Flush a final event that wasn't terminated by a trailing blank line.
  if (buffer.trim()) yield* parseEventBlock(buffer);
}

/**
 * Normalize a provider's streamed response into a uniform sequence of events:
 *   { type: 'chunk', text }   — incremental text
 *   { type: 'usage', usage }  — final token counts
 */
export async function* parseAIStream(response, provider) {
  let usage = null;

  if (provider === 'openai') {
    for await (const obj of sseObjects(response)) {
      const delta = obj?.choices?.[0]?.delta?.content;
      if (delta) yield { type: 'chunk', text: delta };
      if (obj?.usage) {
        usage = {
          promptTokens: obj.usage.prompt_tokens,
          completionTokens: obj.usage.completion_tokens,
          totalTokens: obj.usage.total_tokens,
        };
      }
    }
  } else {
    for await (const obj of sseObjects(response)) {
      const parts = obj?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        const text = parts.map((p) => p.text || '').join('');
        if (text) yield { type: 'chunk', text };
      }
      if (obj?.usageMetadata) {
        usage = {
          promptTokens: obj.usageMetadata.promptTokenCount,
          completionTokens: obj.usageMetadata.candidatesTokenCount,
          totalTokens: obj.usageMetadata.totalTokenCount,
        };
      }
    }
  }

  if (usage) yield { type: 'usage', usage };
}

/** Turn a provider HTTP error into a friendly, safe message. */
export function friendlyProviderError(status, bodyText = '') {
  if (status === 429) return 'Rate limit reached. Please wait a moment and try again.';
  if (status === 401 || status === 403)
    return 'The AI service rejected the API key. Check your key configuration.';
  if (status >= 500) return 'The AI service is temporarily unavailable. Please try again.';

  // Surface a short hint from the provider body when available.
  try {
    const parsed = JSON.parse(bodyText);
    const msg = parsed?.error?.message || parsed?.error?.status;
    if (msg) return `AI service error: ${String(msg).slice(0, 200)}`;
  } catch {
    /* ignore */
  }
  return `AI service error (status ${status}).`;
}
