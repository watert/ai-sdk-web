"use client"
// import { useStore as _useStore } from 'zustand'
import { type StoreApi, createStore } from 'zustand/vanilla'
import { _set, _get } from '../libs/_set';
import _ from 'lodash';

export let store: StoreApi<any> & {
  _set: (path: string, value: any) => void;
  _get: (path: string) => any;
} = createStore((set, get) => ({
  AudioPlayBar: { isPlay: false },
})) as any;
export const appStore = store;
export const getStore = (path: string) => _get(store.getState(), path);
/**
 * 更新存储状态中指定路径的值
 * @param {string} path - 要更新的状态路径，使用点号分隔的字符串（如 'user.name'）
 * @param {any} value - 要设置的新值，可以是具体值或更新函数
 * @throws {Error} 当路径无效或值更新失败时抛出错误
 */
export const setStore = (path: string, value: any) => {
  store.setState((s: any) => {
    if (typeof value === "function") {
      return _set(s, path, value(_get(s, path)));
    }
    return _set(s, path, value);
  });
};

export const setStorePromise = (path: string, promise: Promise<any>) => {
  setStore(path, (prev = {}) => Object.assign({ ...prev, loading: true, error: null }));
  promise.then(value => {
    setStore(path, (prev = {}) => Object.assign({ ...prev, loading: false, error: null, value }));
  }).catch(error => {
    setStore(path, (prev = {}) => Object.assign({ ...prev, loading: false, error }));
  });
}

export function initializeStore(initialState: any) {
  store.setState(_.merge({}, store.getState(), initialState));
}

Object.assign(store, { _get: getStore, _set: setStore });
if (typeof window !== 'undefined') {
  Object.assign(window, { store });
}