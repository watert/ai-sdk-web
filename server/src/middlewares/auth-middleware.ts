import { Request, Response, NextFunction } from 'express';
import { verifySupabaseJwt } from '../models/supabase-utils';

/**
 * 从 Authorization header 中获取并验证 JWT，将用户信息添加到 req 对象
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取 Authorization
    const authHeader = req.headers.authorization;
    
    // 如果没有 Authorization header，跳过验证（允许公开路由）
    if (!authHeader) {
      return next();
    }
    
    // 提取 JWT（格式：Bearer <token>）
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({ error: '无效的 Authorization 头格式' });
    }
    
    const jwt = tokenParts[1];
    
    // 验证 JWT
    const { payload } = await verifySupabaseJwt(jwt);
    
    // 将用户信息添加到 req 对象中
    // 扩展 Request 类型以支持 user 属性
    (req as any).user = {
      id: payload.sub,
      email: payload.email,
      ...payload // 添加其他 payload 信息
    };
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error('JWT 验证失败:', error);
    
    // 根据错误类型返回不同的状态码和消息
    if (error instanceof Error) {
      if (error.message.includes('JWTExpired')) {
        return res.status(401).json({ error: '令牌已过期' });
      }
      if (error.message.includes('Invalid Compact JWS')) {
        return res.status(401).json({ error: '无效的令牌格式' });
      }
    }
    
    return res.status(401).json({ error: '身份验证失败' });
  }
};
