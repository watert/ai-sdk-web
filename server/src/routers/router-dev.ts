import { Router, Request, Response, NextFunction } from 'express';
import { aiGenTextStream } from '../methods/ai-sdk/ai-gen-text';

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

function handleAiStreamCall(fn) {
  return async (req: Request, res: Response) => {
    const controller = new AbortController();
    res.on('close', () => { controller.abort(); });
    req.on('abort', () => { controller.abort(); });
    
    const aiStreamResult = fn({ ...req.body, abortSignal: controller.signal });
    res.setHeader('Content-Type', 'text/event-stream');
    aiStreamResult.pipeAiStreamResultToResponse(res);
    await aiStreamResult.toPromise();
  }
}

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
