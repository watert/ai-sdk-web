import { verifySupabaseJwt } from '../src/models/supabase-utils';

// 测试用的 JWT
const TEST_JWT = "eyJhbGciOiJIUzI1NiIsImtpZCI6IlhiZU5hUGNHeW5DTzlISXQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3ZrcXJ3Y3drZWVuZ3psZGxwcm9iLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjOTQ1ZDNiNS1lZDU0LTQ5YzktYTVmMS1kMDhjY2QyY2Y0NmMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY0NDc5OTEwLCJpYXQiOjE3NjQ0NzYzMTAsImVtYWlsIjoiYm9hdHdpbmRAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImJvYXR3aW5kQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImM5NDVkM2I1LWVkNTQtNDljOS1hNWYxLWQwOGNjZDJjZjQ2YyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTc2NDQyMzg0Nn1dLCJzZXNzaW9uX2lkIjoiNGRhY2M1NTYtMGNjOS00NGEyLWFlODEtMDBlMDc1NGI1YjcxIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0._6od1WdMit0IFdbLB2ITiZo3p1FYcHb_T5nim1K5MEs";

describe('verifySupabaseJwt', () => {
  // 测试环境变量是否正确加载
  it('should have SUPABASE_URL loaded from env', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(typeof process.env.SUPABASE_URL).toBe('string');
  });

  // 测试验证有效 JWT
  it('should verify a valid JWT successfully', async () => {
    const result = await verifySupabaseJwt(TEST_JWT);
    
    expect(result).toBeDefined();
    expect(result.payload).toBeDefined();
    expect(result.payload.sub).toBe('c945d3b5-ed54-49c9-a5f1-d08ccd2cf46c');
    expect(result.payload.email).toBe('boatwind@gmail.com');
    expect(result.payload.iss).toBe('https://vkqrwcwkeengzldlprob.supabase.co/auth/v1');
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