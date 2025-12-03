import { Router, Request, Response, NextFunction } from 'express';
import { aiGenTextStream } from '../methods/ai-sdk/ai-gen-text';
import { handleAiStreamCall } from '../libs/stream-helper';

const router = Router();

// GET /dev/test endpoint for testing API_KEY authentication
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API_KEY authentication successful!',
    user: req.user || 'No user found - JWT not provided or invalid',
    timestamp: new Date().toISOString()
  });
});

// POST /dev/ai-gen-stream endpoint for AI text generation with streaming
router.post('/ai-gen-stream', handleAiStreamCall((options) => {
  return aiGenTextStream({
    onAbort: ({ steps }) => { console.log('aborted', steps?.length) },
    ...options
  });
}));

export default router;
