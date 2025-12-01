// 在任何其他导入之前加载环境变量
import './init-dotenv';

import express, { Request, Response } from 'express';
import routerDev from './routers/router-dev';
import routerAccount from './routers/router-account';
import { authMiddleware } from './middlewares/auth-middleware';
import session from 'express-session';
import MemoryStore from 'memorystore';

const app = express();
const PORT = process.env.PORT || 5188;

// 中间件：解析 JSON 主体
app.use(express.json());

// 配置 session 中间件
const MemoryStoreInstance = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true, // 确保 session 被保存
  saveUninitialized: true, // 确保未初始化的 session 也被保存
  store: new MemoryStoreInstance({
    checkPeriod: 86400000 // 24 小时检查一次过期会话
  }),
  cookie: {
    maxAge: 86400000, // 24 小时过期
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // 生产环境使用 secure cookie
  }
}));

// GET / 端点
app.get('/', (req: Request, res: Response) => {
  res.json({
      message: 'Hello from GET / endpoint with src directory watch!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
});

// POST / 端点
app.post('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from POST / endpoint!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    receivedData: req.body
  });
});

// 挂载用于测试 session 的路由器，无需 auth 验证
import routerTest from './routers/router-test';
app.use('/test', routerTest);

// 挂载带有 API_KEY 验证和 JWT 认证的开发路由器
app.use('/dev', authMiddleware({ authRequired: true }), routerDev);
app.use('/account', authMiddleware({ authRequired: false }), routerAccount);

// Express 错误处理中间件
app.use((err: Error, req: Request, res: Response) => {
  console.error('Express 错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器正在运行于 http://localhost:${PORT}`);
  console.log('可用端点:');
  console.log('  GET  / - 返回简单的 JSON 响应');
  console.log('  POST / - 返回接收到的数据');
  console.log('  POST /dev/ai-gen-stream - AI 文本生成（需要 API_KEY）');
});

// 进程级别的未捕获异常处理
process.on('uncaughtException', (err: Error) => {
  console.error('未捕获的异常:', err);
  // 在这里执行必要的清理操作
  // 在生产环境中不要退出进程，让它继续运行
});

// 进程级别的未处理 Promise 拒绝处理
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('未处理的 Promise 拒绝:', promise, '原因:', reason);
  // 在这里执行必要的清理操作
  // 在生产环境中不要退出进程，让它继续运行
});

// 进程级别的其他错误处理
process.on('error', (err: Error) => {
  console.error('进程错误:', err);
  // 在这里执行必要的清理操作
});