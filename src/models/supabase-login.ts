import { createClient } from "@supabase/supabase-js";

// 初始化 Supabase 客户端
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ""
);

/**
 * 发送魔法链接登录邮件
 * @param email 用户邮箱
 * @param redirectTo 登录成功后的重定向URL，默认为当前页面URL
 * @returns Promise<void>
 */
export const sendMagicLink = async (email: string, redirectTo?: string): Promise<{ error: any }> => {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo || window.location.href,
    },
  });
};

/**
 * 登出当前用户
 * @returns Promise<void>
 */
export const signOut = async (): Promise<{ error: any }> => {
  return await supabase.auth.signOut();
};

/**
 * 获取当前会话
 * @returns Promise<{ session: any }>
 */
export const getSession = async (): Promise<{ data: { session: any } }> => {
  return await supabase.auth.getSession();
};

/**
 * 监听会话状态变化
 * @param callback 状态变化回调函数
 * @returns { data: { subscription: { unsubscribe: () => void } } }
 */
export const onAuthStateChange = (callback: (event: any, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * 验证 OTP 令牌（用于魔法链接回调）
 * @param token_hash 令牌哈希
 * @returns Promise<{ error: any }>
 */
export const verifyOtp = async (token_hash: string) => {
  return await supabase.auth.verifyOtp({
    token_hash,
    type: "email",
  });
};
