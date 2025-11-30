import { jwtVerify } from 'jose';

/**
 * 验证 Supabase JWT 令牌
 * @param jwt JWT 令牌字符串
 * @returns 验证结果
 */
export async function verifySupabaseJwt(jwt: string) {
  // 从环境变量获取 Supabase JWT 密钥
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!supabaseJwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET 环境变量未配置');
  }

  // 验证 JWT - 使用本地密钥
  return jwtVerify(jwt, new TextEncoder().encode(supabaseJwtSecret), {
    algorithms: ['HS256']
  });
}