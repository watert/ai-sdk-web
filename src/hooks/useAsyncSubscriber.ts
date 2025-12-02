import { useCallback, useSyncExternalStore, type DependencyList } from 'react';
import { useAsyncFn } from 'react-use';

// 定义泛型 HandlerType 接口，支持具体的状态类型
interface HandlerType<TState> {
  subscribe: (fn: (state: TState) => void) => () => void;
  getState: () => TState;
  abort?: () => void;
}

// 添加泛型支持，实现类型推断
export function useAsyncSubscriberFn<TState, TParams extends any[] = []>(
  func: (...params: TParams) => Promise<HandlerType<TState>>, 
  deps: DependencyList
): [TState | undefined, (...params: TParams) => Promise<void>, () => void] {
  const [resp, fn] = useAsyncFn(func, deps);
  const getState = resp.value?.getState || (() => undefined as TState | undefined);
  const subscribe = useCallback(resp.value?.subscribe || (() => () => {}), [resp.value?.subscribe]);
  
  // 使用 useSyncExternalStore 的泛型版本
  const state = useSyncExternalStore<TState | undefined>(
    subscribe,
    getState,
    getState
  );
  
  // 返回 abort 函数，用于取消请求
  const abort = useCallback(() => {
    resp.value?.abort?.();
  }, [resp.value]);
  
  return [state, fn as any, abort];
}