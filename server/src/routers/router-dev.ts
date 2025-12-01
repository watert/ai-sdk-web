import { Router, Request, Response, NextFunction } from 'express';
import { aiGenTextStream } from '../methods/ai-sdk/ai-gen-text';
import { authMiddleware } from '../middlewares/auth-middleware';

const router = Router();
router.use(authMiddleware);
// Middleware to validate API_KEY from Bearer token
const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Bearer token is required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || token !== apiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// Apply API_KEY validation to all routes in this router
router.use(validateApiKey);

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
router.post('/ai-gen-stream', async (req: Request, res: Response) => {
  try {
    const controller = new AbortController();

    res.on('close', () => {
      console.trace('[close] Request closed, aborting AI generation');
      controller.abort();
    });
    req.on('abort', () => {
      console.log('[abort] Request aborted, aborting AI generation');
      controller.abort();
    });

    // Use request body as options for aiGenTextStream and pass the abortSignal
    const aiStreamResult = aiGenTextStream({
      onAbort: ({ steps }) => { console.log('aborted', steps?.length) },
      ...req.body,
      abortSignal: controller.signal
    });
    
    res.setHeader('Content-Type', 'text/event-stream');
    aiStreamResult.pipeAiStreamResultToResponse(res);
    await aiStreamResult.toPromise();
  } catch (error) {
    console.warn('An error occurred during AI text generation', error);
    // res.status(500).json({
    //   error: 'An error occurred during AI text generation',
    //   message: error instanceof Error ? error.message : String(error)
    // });
  }
});

export default router;
