import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import generateRoute from './routes/generate.js';
import { getProviderConfig } from './utils/aiClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Simple health/info endpoint (never exposes the key).
app.get('/api/health', (_req, res) => {
  const { provider, model, hasKey } = getProviderConfig();
  res.json({ status: 'ok', provider, model, keyConfigured: hasKey });
});

app.use('/api', generateRoute);

// Catch-all 404 for unknown API routes.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  const { provider, model, hasKey } = getProviderConfig();
  console.log(`\n  SmartSummarizer AI backend running on http://localhost:${PORT}`);
  console.log(`  Provider: ${provider} (${model})`);
  if (!hasKey) {
    console.warn(
      `  ⚠  No API key found for "${provider}". Copy .env.example to .env and add your key.\n`
    );
  } else {
    console.log('  API key: loaded ✓\n');
  }
});
