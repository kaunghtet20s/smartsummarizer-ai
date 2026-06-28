// Vercel serverless function for GET /api/health (never exposes the key).
import { getProviderConfig } from '../server/utils/aiClient.js';

export default function handler(_req, res) {
  const { provider, model, hasKey } = getProviderConfig();
  res.status(200).json({ status: 'ok', provider, model, keyConfigured: hasKey });
}
