// Frontend API client. Talks to the backend over a relative `/api` path so the
// AI provider key stays on the server. Consumes a Server-Sent-Events (SSE)
// stream and surfaces chunks + token usage to the caller.

/**
 * Stream a summary from the backend.
 *
 * @param {object}   args
 * @param {object}   args.payload   { mode, text, length, style, tone, language }
 * @param {(t:string)=>void} args.onChunk  called with each new text chunk
 * @param {(u:object)=>void} [args.onUsage] called once with token usage
 * @param {AbortSignal} [args.signal]
 * @returns {Promise<{text:string, usage:object|null}>}
 */
export async function streamSummary({ payload, onChunk, onUsage, signal }) {
  let res;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('Network error — is the backend server running?');
  }

  // Validation / server errors arrive as plain JSON (before the stream starts).
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore parse errors, keep default message */
    }
    if (res.status === 429) {
      message = 'Rate limit reached. Please wait a moment and try again.';
    }
    throw new Error(message);
  }

  if (!res.body) throw new Error('Streaming is not supported by this browser.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let usage = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const line = event.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const json = line.slice(5).trim();
      if (!json || json === '[DONE]') continue;

      let parsed;
      try {
        parsed = JSON.parse(json);
      } catch {
        continue;
      }

      if (parsed.type === 'chunk' && parsed.text) {
        fullText += parsed.text;
        onChunk?.(parsed.text);
      } else if (parsed.type === 'usage') {
        usage = parsed.usage;
        onUsage?.(parsed.usage);
      } else if (parsed.type === 'error') {
        throw new Error(parsed.message || 'The AI service returned an error.');
      }
    }
  }

  return { text: fullText, usage };
}
