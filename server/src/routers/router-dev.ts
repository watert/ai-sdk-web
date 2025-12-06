import { Router, Request, Response, NextFunction } from 'express';
import { aiGenTextStream } from '../methods/ai-sdk/ai-gen-text';
import { createAiStreamMiddleware } from '../libs/stream-helper';
import { handleIndustryResearchTask, baseIndustryResearchList } from '../methods/industry-research';

const router = Router();

// GET /dev/test endpoint for testing API_KEY authentication
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true, message: 'API_KEY authentication successful!',
    user: req.user || 'No user found - JWT not provided or invalid',
    timestamp: new Date().toISOString()
  });
});

// POST /dev/ai-gen-stream endpoint for AI text generation with streaming
router.post('/ai-gen-stream', createAiStreamMiddleware((bodyWithSignal) => {
  console.log('options', bodyWithSignal);
  return aiGenTextStream({
    onAbort: ({ steps }) => { console.log('aborted', steps?.length) },
    ...bodyWithSignal
  });
}));


router.get('/industry-research/info', (req: Request, res: Response) => {
  res.json({ data: { defaultConfigs: baseIndustryResearchList } });
});
router.post('/industry-research', createAiStreamMiddleware((bodyWithSignal) => {
  return handleIndustryResearchTask(bodyWithSignal);
}));

export default router;
