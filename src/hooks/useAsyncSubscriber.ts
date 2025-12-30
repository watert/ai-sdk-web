import { useCallback, useState, useSyncExternalStore, type DependencyList } from 'react';
import { useAsyncFn } from 'react-use';

// 定义泛型 HandlerType 接口，支持具体的状态类型
export interface HandlerType<TState> {
  subscribe: (fn: (state: TState) => void) => () => void;
  getState: () => TState;
  abort?: () => void;
}
type MaybePromise<T> = T | Promise<T>;
export function useAsyncIterableFn<TChunk, TParams extends any[] = []>(
  func: (...params: TParams) => MaybePromise<AsyncIterable<TChunk>>,
  deps: DependencyList
) {
  const [state, setState] = useState<TChunk | undefined>(undefined);
  const fn = useCallback(async (...params: TParams) => {
    const iterable = await func(...params);
    for await (const chunk of iterable) { setState(chunk); }
  }, deps);
  return [state, fn];
}

export type UseAsyncSubscriberReturn<TState = any, TParams = any> = {
  state: TState;
  send: (params?: TParams) => Promise<HandlerType<TState>>;
  abort: () => void;
}
// 添加泛型支持，实现类型推断
export function useAsyncSubscriberFn<TState, TParams = any>(
  func: (params?: TParams) => Promise<HandlerType<TState>>, 
  deps: DependencyList
): UseAsyncSubscriberReturn<TState, TParams> {
  const [resp, fn] = useAsyncFn(func, deps);
  const getState = resp.value?.getState || (() => undefined as TState);
  const subscribe = useCallback(resp.value?.subscribe || (() => () => {}), [resp.value?.subscribe]);
  
  // 使用 useSyncExternalStore 的泛型版本
  const state = useSyncExternalStore<TState>( subscribe, getState );
  
  // 返回 abort 函数，用于取消请求
  const abort = useCallback(() => {
    resp.value?.abort?.();
  }, [resp.value]);
  
  return { state, send: fn, abort };
}