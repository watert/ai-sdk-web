"use client";

import { store } from '../store/store';
import axios from 'axios';

export const appAxios = axios.create({
  baseURL: '/api',
});

// 添加请求拦截器，统一管理请求头
appAxios.interceptors.request.use(
  (config) => {
    // 设置基础请求头
    config.headers['Content-Type'] = 'application/json';
    config.headers['x-locale'] = store._get('locale');
    
    // 从 store 获取 access_token
    const accessToken = store._get('session.access_token');
    
    // 如果存在 access_token，则添加到 Authorization 头
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);
