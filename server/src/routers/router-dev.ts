import { Router, Request, Response, NextFunction } from 'express';
import { aiGenTextStream } from '../methods/ai-sdk/ai-gen-text';
import { createAiStreamMiddleware } from '../libs/stream-helper';
import { handleIndustryResearchTask, baseIndustryResearchList } from '../methods/industry-research';
import { getQuizForm, getWeather } from '../methods/ai-sdk/aisdk-tools-sample';
import { stepCountIs } from 'ai';
import { USE_LOCAL_MONGO } from '../config';
import asyncWait from '../libs/asyncWait';

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
  return aiGenTextStream(bodyWithSignal);
}));
router.post('/ai-gen-stream-tools', createAiStreamMiddleware((bodyWithSignal) => {
  return aiGenTextStream({ ...bodyWithSignal,
    stopWhen: stepCountIs(5), tools: { getWeather, getQuizForm },
  });
}));

router.get('/industry-research/info', (req: Request, res: Response) => {
  res.json({ data: { defaultConfigs: baseIndustryResearchList } });
});
router.post('/industry-research', createAiStreamMiddleware((bodyWithSignal) => {
  return handleIndustryResearchTask({ local: USE_LOCAL_MONGO, ...bodyWithSignal });
}));

export default router;
