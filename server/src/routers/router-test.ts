import { Router, Request, Response } from 'express';
import asyncWait from '../libs/asyncWait';
import { createAiStreamMiddleware } from '../libs/stream-helper';
import { aiGenTextStream } from '../methods/ai-sdk/ai-gen-text';

const router = Router();

router.get('/test-uimsg-stream', createAiStreamMiddleware(async (body) => {
  return (await aiGenTextStream({ platform: 'OLLAMA', prompt: 'hello', ...body })).toUIMessageStream();
}));

router.get('/test-async-iterable', createAiStreamMiddleware(async (bodyWithSignal) => {
  const testIterable2 = async function* () {
    for (let i = 0; i < 5; i++) {
      console.log('yield i',i );
      yield i; await asyncWait(200);
    }
    return 'Done';
  }
  return testIterable2();
}));
// 测试 session 设置
router.get('/set-session', (req: Request, res: Response) => {
  // 直接在 session 中设置一个测试用户
  req.session.user = {
    id: 'test-user-123',
    email: 'test@example.com',
    iss: 'test-issuer',
    sub: 'test-user-123'
  };
  
  res.json({
    success: true,
    message: 'Session set successfully!',
    session: req.session,
    timestamp: new Date().toISOString()
  });
});

// 测试 session 获取
router.get('/get-session', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Session retrieved successfully!',
    session: req.session,
    userFromSession: req.session.user,
    timestamp: new Date().toISOString()
  });
});

// 测试 session 清除
router.get('/clear-session', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear session!',
        error: err.message
      });
    } else {
      res.json({
        success: true,
        message: 'Session cleared successfully!',
        timestamp: new Date().toISOString()
      });
    }
  });
});

export default router;
