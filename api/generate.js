// Vercel serverless function for POST /api/generate.
// Reuses the exact same handler as the local Express server.
import { handleGenerate } from '../server/generateHandler.js';

// Allow up to 60s — summary streaming can take a little while on long inputs.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  return handleGenerate(req, res);
}
