"use client";

import type { Dictionary } from 'lodash';
import { store } from '../store/store';
import axios from 'axios';

export const appAxios = axios.create({
  baseURL: '/api',
});

export function getAppReqHeaders() {
  const headers: Dictionary<string> = {
    'Content-Type': 'application/json',
    'x-locale': store._get('locale'),
  };
  const accessToken = store._get('session.access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}
// 添加请求拦截器，统一管理请求头
appAxios.interceptors.request.use(
  (config) => {
    Object.assign(config.headers, getAppReqHeaders());
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);
