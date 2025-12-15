
/**
 * Example:

const it = makeIterable();
(async () => {
  for (let i = 0; i < 5; i++) {
    it.yield(i); await asyncWait(1e3);
  }
  it.resolve('SUCCESS')
})();
for await (const value of it.start()) {
  console.log('iterable', value);
}
console.log('done done');
 */

const asyncWait = (time = 16) => new Promise((resolve) => setTimeout(resolve, time));
export function testIterable() {
  return makeAsyncIterable(async (onChange) => {
    for (let i = 0; i < 5; i++) {
      onChange(JSON.stringify(i)); await asyncWait(200);
    }
    return '[DONE]';
  });
}

export async function handleAsyncIterable<T = any>(iterable: AsyncIterable<T>, onChange: (value: T) => any): Promise<T> {
  let res;
  for await (const value of iterable) {
    onChange(value);
    res = value;
  }
  return res;
}
export function makeAsyncIterable(fn: (yieldItem: (value: any) => Promise<void>) => Promise<any>) {
  const it = makeIterable();
  const iterable = it.start();
  fn(it.yieldItem).then(it.resolve, it.reject);
  return iterable as AsyncIterable<any>;
}

type MakeIterableReturn<T = any> = {
  start: () => AsyncIterable<T>; // Must be called before `yieldItem` or `getIterable`.
  yieldItem: (item: T) => Promise<void>;
  end: () => void;
  getIterable: () => AsyncIterable<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}
export function makeIterable<T = any>(): MakeIterableReturn<T> { // v2
  let itemQueue: T[] = [];
  let waitingConsumers: Array<() => void> = [];
  let hasEnded = false;
  let currentError: any = null;

  const start = () => {
    itemQueue = [];
    waitingConsumers = [];
    hasEnded = false;
    currentError = null;
    return getIterable();
  };

  const yieldItem = async (item: T) => {
    if (hasEnded) {
      console.warn("makeIterable: Attempted to yield item after iteration has ended.");
      return;
    }
    itemQueue.push(item); // Add the new item to the queue.
    if (waitingConsumers.length > 0) {
      const resolve = waitingConsumers.shift();
      if (resolve) { resolve(); }
    }
  };

  /**
   * Signals that no more items will be yielded.
   * Resolves all pending promises for waiting consumers, allowing them to finish.
   */
  const end = () => {
    hasEnded = true; // Set the flag to indicate the end.
    while (waitingConsumers.length > 0) {
      waitingConsumers.shift()?.();
    }
  };

  let _iterable;
  const getIterable = (): AsyncIterable<T> => {
    if (_iterable) { return _iterable; }
    _iterable = (async function* () {
      while (true) {
        if (itemQueue.length > 0) {
          // If there are items in the queue, yield the next one.
          yield itemQueue.shift() as any;
        } else if (hasEnded) {
          // If the queue is empty AND the iterable has ended, we are truly done.
          if (currentError) {
            throw currentError; // Re-throw any error that occurred during the iteration.
          }
          return; // Exit the generator.
        } else {
          // The queue is empty, but the iterable has not ended.
          // Create a promise and wait for it to be resolved (by yieldItem or end).
          await new Promise<void>((resolve) => {
            waitingConsumers.push(resolve); // Add our resolve function to the list of waiting consumers.
          });
          // Once resolved, the loop will re-check the queue and hasEnded status.
        }
      }
    })();
    return _iterable;
  };
  const resolve = (value: T | PromiseLike<T>) => {
    if (hasEnded) { return; }
    hasEnded = true;
    if (typeof value !== 'undefined') {
      itemQueue.push(value as any);
    }
    end();
  };
  const reject = (reason?: any) => {
    if (hasEnded) { return; }
    hasEnded = true;
    currentError = reason;
    end();
  };

  return {
    start,
    yieldItem,
    end,
    getIterable,
    resolve,
    reject,
  };
}
