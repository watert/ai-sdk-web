import { Router, Request, Response } from 'express';

const router = Router();

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
