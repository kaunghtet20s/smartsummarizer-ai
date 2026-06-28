import express from 'express';
import { handleGenerate } from '../generateHandler.js';

const router = express.Router();

// POST /api/generate — delegates to the shared, framework-agnostic handler
// (the same one used by the Vercel serverless function in api/generate.js).
router.post('/generate', handleGenerate);

export default router;
