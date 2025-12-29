export function createDefered<T = any>(): { resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void, promise: Promise<T> } {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res; reject = rej;
  });
  return { resolve: resolve!, reject: reject!, promise };
}
export function createAsyncIterableHandler<T = any>(): {
  yieldItem: (item: T) => void;
  yieldError: (error: any) => void;      // 新增：错误处理
  end: () => Promise<void>;
  iterable: AsyncIterable<T>;
} {
  const itemQueue: T[] = []; // 存放尚未被消费的数据
  let error: any = null;
  const resolverQueue: ((value: IteratorResult<T>) => void)[] = []; // 存放正在等待数据的消费者 (Promise 的 resolve 函数)
  let isDone = false; // 标记迭代是否已结束

  const yieldItem = (item: T) => {
    if (isDone || error) return;
    if (resolverQueue.length > 0) { // 如果有正在等待的消费者，直接把数据给它
      const resolve = resolverQueue.shift()!;
      resolve({ value: item, done: false });
    } else {
      itemQueue.push(item);
    }
  };

  const end = async () => {
    if (isDone) return;
    isDone = true;

    // 释放所有正在等待的消费者，告诉它们迭代结束了
    while (resolverQueue.length > 0) {
      const resolve = resolverQueue.shift()!;
      resolve({ value: undefined as any, done: true });
    }
    if (error) {
      return Promise.reject(error);
    }
  };

  const iterable: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<T>> {
          if (error) { // 4. 如果已经报错了，返回报错
            return Promise.reject(error);
          }
          if (itemQueue.length > 0) { // 1. 如果队列里有现成的数据，直接返回
            return Promise.resolve({ value: itemQueue.shift()!, done: false });
          }
          if (isDone) { // 2. 如果已经结束了，返回 done
            return Promise.resolve({ value: undefined as any, done: true });
          }
          return new Promise((resolve) => { // 3. 否则，返回一个悬挂的 Promise，并把 resolve 存入等待队列
            resolverQueue.push(resolve);
          });
        },
        // 可选：允许消费者提前退出（如 break）
        async return() {
          await end();
          return { value: undefined as any, done: true };
        }
      };
    },
  };
  const yieldError = (err: any) => {
    error = err;
    // 唤醒所有等待者并报错
    while (resolverQueue.length > 0) resolverQueue.shift()!(Promise.reject(err) as any);
  };


  return { yieldItem, end, yieldError, iterable };
}

export function forkAsyncIterable<T>(
  iterable: AsyncIterable<T>
): [AsyncIterable<T>, AsyncIterable<T>] {
  const handlers = [createAsyncIterableHandler<T>(), createAsyncIterableHandler<T>()];
  const yieldItems = (item: T) => handlers.forEach(handler => handler.yieldItem(item));
  (async () => {
    for await (const item of iterable) {
      yieldItems(item);
    }
    handlers.forEach(handler => handler.end());
  })().catch(err => {
    handlers.forEach(handler => handler.yieldError(err));
  });
  return handlers.map(handler => handler.iterable) as any;
}