import { Request, Response, NextFunction } from 'express';
import { verifySupabaseJwt } from '../models/supabase-utils';

/**
 * User 类型定义，基于 Supabase JWT 示例数据
 */
export interface User {
  iss: string; sub: string; aud?: string; exp?: number; iat?: number;
  id: string; email: string; phone?: string;
  user_metadata?: {
    email: string; email_verified: boolean; phone_verified: boolean; sub: string;
  };
  role?: string; aal?: string; session_id?: string; is_anonymous?: boolean;
  // 允许其他自定义属性
  [key: string]: any;
}

/**
 * 扩展 Express Request 类型，添加可选的 user 属性
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

function getReqAuthBearerToken(req: Request) {
  // 提取 JWT（格式：Bearer <token>）
  const tokenParts = req.headers.authorization?.split(' ') || [];
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return null;
  }
  
  return tokenParts[1];
}
/**
 * 从请求对象中获取用户信息
 * @param req Express 请求对象
 * @returns User 对象或 undefined
 */
export const getReqUser = async (req: Request): Promise<User | undefined> => {
  // 首先检查是否存在 API_KEY 环境变量，用于内部 API 调用
  const apiKey = process.env.API_KEY;
  if (apiKey && req.headers.authorization === apiKey) {
    // 返回硬编码的最简 User 对象，兼容内部 API 调用
    return { 
      id: 'internal-api-user', 
      email: 'internal-api@example.com',
      iss: 'internal-api',
      sub: 'internal-api-user'
    } as User;
  }
  
  // 常规 JWT 验证流程
  const jwt = getReqAuthBearerToken(req);
  if (!jwt) { return undefined; }
  
  try {
    const { payload } = await verifySupabaseJwt(jwt);
    return { id: payload.sub, ...payload } as User;
  } catch (error) {
    console.error('JWT 验证失败:', error);
    return undefined;
  }
};

/**
 * 从 Authorization header 中获取并验证 JWT，将用户信息添加到 req 对象
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getReqUser(req);
    if (!user) {
      return res.status(401).json({ error: '未授权' });
    }
    
    req.user = user;
    
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
