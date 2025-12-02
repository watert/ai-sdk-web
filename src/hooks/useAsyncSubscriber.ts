import { useCallback, useSyncExternalStore, type DependencyList } from 'react';
import { useAsyncFn } from 'react-use';
type HandlerType = {
  subscribe: (fn: (state: any) => void) => () => void;
  getState: () => any;
}
export function useAsyncSubscriberFn(
  func: (...params: any[]) => Promise<HandlerType>, deps: DependencyList
) {
  const [resp, fn] = useAsyncFn(func, deps);
  const getState = resp.value?.getState || (() => undefined);
  const subscribe = useCallback(resp.value?.subscribe || (() => () => {}), [resp.value]);
  const state = useSyncExternalStore(
    subscribe,
    getState,
  );
  return [state, fn];
}