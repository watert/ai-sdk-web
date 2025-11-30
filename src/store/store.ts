/**
 * 应用状态管理存储
 * 基于 Zustand 实现，提供路径访问和更新功能
 * 
 * @module store
 * @see https://zustand-demo.pmnd.rs/ 了解更多关于 Zustand 的信息
 */

"use client";

import { type StoreApi, createStore } from 'zustand/vanilla';
import { useStore as _useStore } from 'zustand'
import { _set, _get } from '../libs/_set';
import _ from 'lodash';

/**
 * 扩展的 StoreApi 类型
 * @template T - 状态类型
 */
type ExtendedStoreApi<T> = StoreApi<T> & {
  /**
   * 设置状态路径值
   * @param {string} path - 状态路径
   * @param {any} value - 要设置的值
   */
  _set: (path: string, value: any) => void;
  /**
   * 获取状态路径值
   * @param {string} path - 状态路径
   * @returns {any} 状态值
   */
  _get: (path: string) => any;
};

/**
 * 应用初始状态
 */
const initialState = {
  /**
   * 音频播放条状态
   */
  AudioPlayBar: {
    isPlay: false,
  },
  /**
   * 用户会话状态
   */
  session: null,
};

/**
 * 应用全局状态存储实例
 * 扩展了 Zustand StoreApi，添加了 _set 和 _get 方法用于路径访问
 */
export let store: ExtendedStoreApi<any> = createStore((_set, _get) => initialState) as any;


/**
 * 获取存储状态中指定路径的值
 * @param {string} path - 要获取的状态路径，使用点号分隔的字符串（如 'user.name'）
 * @returns {any} 状态值
 */
export const getStore = (path: string): any => _get(store.getState(), path);

/**
 * 更新存储状态中指定路径的值
 * @param {string} path - 要更新的状态路径，使用点号分隔的字符串（如 'user.name'）
 * @param {any|((currentValue: any) => any)} value - 要设置的新值，可以是具体值或更新函数
 * @example
 * // 设置具体值
 * setStore('user.name', 'John');
 * // 使用更新函数
 * setStore('counter', (current) => current + 1);
 */
export const setStore = (path: string, value: any): void => {
  store.setState((s: any) => {
    if (typeof value === "function") {
      return _set(s, path, value(_get(s, path)));
    }
    return _set(s, path, value);
  });
};

/**
 * 使用 Promise 更新存储状态，自动处理 loading 和 error 状态
 * @param {string} path - 要更新的状态路径
 * @param {Promise<any>} promise - 要处理的 Promise
 * @example
 * setStorePromise('user.data', fetchUser());
 * // 结果将更新为 { loading: false, error: null, value: userData }
 */
export const setStorePromise = (path: string, promise: Promise<any>): void => {
  // 设置加载状态
  setStore(path, (prev = {}) => ({ ...prev, loading: true, error: null }));
  
  promise
    .then(value => {
      // Promise 成功，更新值并设置加载完成
      setStore(path, (prev = {}) => ({ ...prev, loading: false, error: null, value }));
    })
    .catch(error => {
      // Promise 失败，更新错误信息并设置加载完成
      setStore(path, (prev = {}) => ({ ...prev, loading: false, error }));
    });
};

/**
 * 初始化存储状态
 * @param {any} initialState - 初始状态对象
 * @example
 * initializeStore({ user: { name: 'John' } });
 */
export function initializeStore(initialState: any): void {
  store.setState(_.merge({}, store.getState(), initialState));
}

// 为 store 添加 _get 和 _set 方法
Object.assign(store, { _get: getStore, _set: setStore });

function shallowEqual(a: any, b: any) {
  if (a === b) return true;
  if (!(a instanceof Object) || !(b instanceof Object)) return false;
  const keys = Object.keys(a);
  const length = keys.length;
  for (let i = 0; i < length; i++) if (!(keys[i] in b)) return false;
  for (let i = 0; i < length; i++) if (a[keys[i]] !== b[keys[i]]) return false;
  return length === Object.keys(b).length;
};


export const useStore = (selector: string | ((s: any) => any), _equalityFn: any = shallowEqual) => {
  if (typeof selector === 'string') {
    return _useStore(store, (state) => _get(state, selector))
  }
  return _useStore(store, selector);
}

export const appStore = store;
export const useAppStore = useStore;

// 开发环境下，将 store 挂载到 window 对象以便调试
if (typeof window !== 'undefined') {
  Object.assign(window, { store });
}