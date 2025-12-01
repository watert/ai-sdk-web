import { verifySupabaseJwt } from '../src/models/supabase-utils';
import { SignJWT } from 'jose';

// 动态生成测试用的 JWT
async function generateTestJwt() {
  // 从环境变量获取 Supabase JWT 密钥
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!supabaseJwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET 环境变量未配置');
  }

  // 设置过期时间为当前时间 + 1 小时
  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedTime = Math.floor(Date.now() / 1000);

  // 生成 JWT
  return new SignJWT({
    iss: 'https://test.supabase.co/auth/v1',
    sub: 'c945d3b5-ed54-49c9-a5f1-d08ccd2cf46c',
    aud: 'authenticated',
    exp: expirationTime,
    iat: issuedTime,
    email: 'boatwind@gmail.com',
    phone: '',
    app_metadata: {
      provider: 'email',
      providers: ['email']
    },
    user_metadata: {
      email: 'boatwind@gmail.com',
      email_verified: true,
      phone_verified: false,
      sub: 'c945d3b5-ed54-49c9-a5f1-d08ccd2cf46c'
    },
    role: 'authenticated',
    aal: 'aal1',
    amr: [
      {
        method: 'otp',
        timestamp: issuedTime
      }
    ],
    session_id: '4dacc556-0cc9-44a2-ae81-00e0754b5b71',
    is_anonymous: false
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(supabaseJwtSecret));
}

describe('verifySupabaseJwt', () => {
  // 测试环境变量是否正确加载
  it('should have SUPABASE_URL loaded from env', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(typeof process.env.SUPABASE_URL).toBe('string');
  });

  // 测试验证有效 JWT
  it('should verify a valid JWT successfully', async () => {
    const TEST_JWT = await generateTestJwt();
    const result = await verifySupabaseJwt(TEST_JWT);
    
    expect(result).toBeDefined();
    expect(result.payload).toBeDefined();
    expect(result.payload.sub).toBe('c945d3b5-ed54-49c9-a5f1-d08ccd2cf46c');
    expect(result.payload.email).toBe('boatwind@gmail.com');
    expect(result.payload.iss).toBe('https://test.supabase.co/auth/v1');
  });

  // 测试验证无效 JWT
  it('should throw an error for an invalid JWT', async () => {
    await expect(verifySupabaseJwt('invalid.jwt.token')).rejects.toThrow();
  });

  // 测试验证过期 JWT
  it('should throw an error for an expired JWT', async () => {
    // 这个 JWT 已过期
    const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    // const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await expect(verifySupabaseJwt(expiredJwt)).rejects.toThrow();
  });
});