import { useCallback, useSyncExternalStore, type DependencyList } from 'react';
import { useAsyncFn } from 'react-use';
type HandlerType = {
  subscribe: (fn: (state: any) => void) => () => void;
  getState: () => any;
  abort?: () => void;
}
export function useAsyncSubscriberFn(
  func: (...params: any[]) => Promise<HandlerType>, deps: DependencyList
) {
  const [resp, fn] = useAsyncFn(func, deps);
  const getState = resp.value?.getState || (() => undefined);
  const subscribe = useCallback(resp.value?.subscribe || (() => () => {}), [resp.value?.subscribe]);
  const state = useSyncExternalStore(
    subscribe,
    getState,
  );
  // 返回 abort 函数，用于取消请求
  const abort = useCallback(() => {
    resp.value?.abort?.();
  }, [resp.value]);
  return [state, fn, abort];
}