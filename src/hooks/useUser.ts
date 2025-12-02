import { useState, useEffect } from "react";
import { appStore, useAppStore } from "../store/store";
import { getSession, onAuthStateChange, sendMagicLink, signOut, verifyOtp } from "../models/supabase-login";
import { appAxios } from "../models/appAxios";

/**
 * 用户登录状态管理 Hook
 * @returns 包含登录状态和方法的对象
 */
export const useUser = () => {
  // 从全局 store 获取用户会话
  const session = useAppStore("session");
  const setSession = (value: any) => appStore._set("session", value);

  // 本地状态
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // 检查 URL 中的 token_hash 参数
  const checkUrlForAuth = () => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");

    if (token_hash) {
      // console.log("发现 token_hash，正在验证...");
      // 验证 OTP 令牌
      verifyOtp(token_hash).then(({ error }) => {
        if (error) {
          console.error("验证 OTP 失败:", error.message);
          setAuthError(error.message);
        } else {
          // console.log("验证 OTP 成功，等待会话更新...");
          setAuthSuccess(true);
        }
      });
    }
  };

  // 初始化和监听会话
  useEffect(() => {
    // 检查 URL 中的认证参数
    checkUrlForAuth();

    // 获取现有会话
    getSession().then(({ data: { session } }) => {
      // console.log("获取现有会话:", session);
      setSession(session);
      // 如果会话已存在且 URL 中有认证参数，清除 URL 参数
      const params = new URLSearchParams(window.location.search);
      if (session && (params.get("token_hash") || params.get("type"))) {
        // console.log("会话已存在，清除 URL 参数");
        // window.history.replaceState({}, document.title, "/");
      }
      // 如果会话已存在，调用 /account/user 获取用户信息
      if (session) {
        // console.log("会话已存在，调用 /account/user 获取用户信息");
        appAxios.get('/account/user')
          .then(response => {
            // console.log("获取用户信息成功:", response.data);
          })
          .catch(error => {
            console.error("获取用户信息失败:", error);
          });
      }
    });

    // 监听认证状态变化
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      // console.log("认证状态变化:", event, session);
      setSession(session);
      // 当会话成功创建后，清除 URL 参数
      if (event === "SIGNED_IN" && session) {
        // console.log("用户已登录，清除 URL 参数");
        // window.history.replaceState({}, document.title, "/");
        // 使用 appAxios 调用 GET /account/user
        // console.log("调用 /account/user 获取用户信息");
        appAxios.get('/account/user')
          .then(response => {
            // console.log("获取用户信息成功:", response.data);
          })
          .catch(error => {
            console.error("获取用户信息失败:", error);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * 处理登录逻辑
   * @param email 用户邮箱
   * @returns Promise<void>
   */
  const handleLogin = async (email: string) => {
    setLoading(true);
    setAuthError(null);
    
    // 传递当前页面URL作为重定向地址
    const { error } = await sendMagicLink(email, window.location.href);
    
    if (error) {
      setAuthError(error.message);
    }
    
    setLoading(false);
    return { error };
  };

  /**
   * 处理登出逻辑
   * @returns Promise<void>
   */
  const handleLogout = async () => {
    setLoading(true);
    
    const { error } = await signOut();
    
    if (!error) {
      setSession(null);
    }
    
    setLoading(false);
    return { error };
  };

  return {
    session,
    email,
    setEmail,
    loading,
    authError,
    authSuccess,
    handleLogin,
    handleLogout,
  };
};
