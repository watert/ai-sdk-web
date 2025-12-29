import { createDefered, createAsyncIterableHandler, forkAsyncIterable } from './async-iterable-helpers';

describe('async-iterable-helpers', () => {
  describe('createDefered', () => {
    test('应返回包含 resolve、reject 和 promise 的对象', () => {
      const defered = createDefered();
      expect(defered).toHaveProperty('resolve');
      expect(defered).toHaveProperty('reject');
      expect(defered).toHaveProperty('promise');
      expect(typeof defered.resolve).toBe('function');
      expect(typeof defered.reject).toBe('function');
      expect(defered.promise instanceof Promise).toBe(true);
    });

    test('resolve 函数应能解析 promise', async () => {
      const defered = createDefered<string>();
      const testValue = 'test-value';
      
      setTimeout(() => defered.resolve(testValue), 10);
      const result = await defered.promise;
      
      expect(result).toBe(testValue);
    });

    test('reject 函数应能拒绝 promise', async () => {
      const defered = createDefered<string>();
      const testError = new Error('test-error');
      
      setTimeout(() => defered.reject(testError), 10);
      
      await expect(defered.promise).rejects.toThrow(testError);
    });

    test('当原始可迭代对象抛出错误时，两个分叉的可迭代对象都应传播该错误', async () => {
      const testError = new Error('original-iterable-error');
      const originalIterable = (async function* () {
        yield 'a';
        yield 'b';
        throw testError; // 在生成两个值后抛出错误
      })();
      
      const [iterable1, iterable2] = forkAsyncIterable(originalIterable);
      
      // 测试第一个可迭代对象
      const receivedValues1: string[] = [];
      await expect((async () => {
        for await (const item of iterable1) {
          receivedValues1.push(item);
        }
      })()).rejects.toThrow(testError);
      expect(receivedValues1).toEqual(['a', 'b']);
      
      // 测试第二个可迭代对象
      const receivedValues2: string[] = [];
      await expect((async () => {
        for await (const item of iterable2) {
          receivedValues2.push(item);
        }
      })()).rejects.toThrow(testError);
      expect(receivedValues2).toEqual(['a', 'b']);
    });
  });

  describe('错误处理', () => {
    test.only('当消费者在迭代过程中抛出错误时，不会影响其他消费者', async () => {
      const handler = createAsyncIterableHandler<number>();
      const values = [1, 2, 3, 4];
      
      // 启动一个会抛出错误的迭代器
      const errorIteratorPromise = (async () => {
        const receivedValues: number[] = [];
        for await (const item of handler.iterable) {
          console.log('pushitem', item);
          receivedValues.push(item);
          if (item === 2) {
            throw new Error('consumer-error');
          }
        }
        return receivedValues;
      })();
      
      // 启动一个正常的迭代器
      const normalIteratorPromise = (async () => {
        const receivedValues: number[] = [];
        for await (const item of handler.iterable) {
          receivedValues.push(item);
        }
        return receivedValues;
      })();
      
      // 产生值
      values.forEach(value => handler.yieldItem(value));
      handler.end();
      
      // 第一个迭代器应该抛出错误
      await expect(errorIteratorPromise).rejects.toThrow('consumer-error');
      
      // 第二个迭代器应该正常完成
      const normalResult = await normalIteratorPromise;
      expect(normalResult).toEqual(values);
    });

    test('当使用 break 退出循环时，应调用 return 方法结束迭代', async () => {
      const handler = createAsyncIterableHandler<number>();
      const receivedValues: number[] = [];
      
      // 启动迭代
      const iterationPromise = (async () => {
        for await (const item of handler.iterable) {
          receivedValues.push(item);
          if (item === 2) {
            break; // 使用 break 退出循环
          }
        }
      })();
      
      // 产生值
      handler.yieldItem(1);
      handler.yieldItem(2);
      handler.yieldItem(3); // 这个值应该不会被接收
      
      // 等待迭代完成
      await iterationPromise;
      
      expect(receivedValues).toEqual([1, 2]);
    });
  });

  describe('createAsyncIterableHandler', () => {
    test('应返回包含 yieldItem、end 和 iterable 的对象', () => {
      const handler = createAsyncIterableHandler();
      
      expect(handler).toHaveProperty('yieldItem');
      expect(handler).toHaveProperty('end');
      expect(handler).toHaveProperty('iterable');
      expect(typeof handler.yieldItem).toBe('function');
      expect(typeof handler.end).toBe('function');
      expect(typeof handler.iterable[Symbol.asyncIterator]).toBe('function');
    });

    test('iterable 应能接收 yieldItem 产生的值', async () => {
      const handler = createAsyncIterableHandler<number>();
      const values = [1, 2, 3];
      const receivedValues: number[] = [];
      
      // 启动迭代
      const iterationPromise = (async () => {
        for await (const item of handler.iterable) {
          receivedValues.push(item);
        }
      })();
      
      values.forEach(value => handler.yieldItem(value)); // 产生值
      handler.end(); // 结束迭代
      
      await iterationPromise; // 等待迭代完成
      
      expect(receivedValues).toEqual(values);
    });

    test('end 函数应能结束迭代', async () => {
      const handler = createAsyncIterableHandler<number>();
      const receivedValues: number[] = [];
      
      // 启动迭代
      const iterationPromise = (async () => {
        for await (const item of handler.iterable) {
          receivedValues.push(item);
        }
      })();
      
      // 产生一个值，然后结束
      handler.yieldItem(1);
      handler.end();
      
      // 尝试产生更多值（应该被忽略）
      handler.yieldItem(2);
      handler.yieldItem(3);
      
      // 等待迭代完成
      await iterationPromise;
      
      expect(receivedValues).toEqual([1]);
    });
  });

  describe('forkAsyncIterable', () => {
    test('应返回两个异步可迭代对象', () => {
      const originalIterable = (async function* () {
        yield 1;
        yield 2;
      })();
      
      const [iterable1, iterable2] = forkAsyncIterable(originalIterable);
      
      expect(typeof iterable1[Symbol.asyncIterator]).toBe('function');
      expect(typeof iterable2[Symbol.asyncIterator]).toBe('function');
    });

    test('两个可迭代对象都应接收原始可迭代对象的值', async () => {
      const originalValues = [1, 2, 3];
      const originalIterable = (async function* () {
        for (const value of originalValues) {
          yield value;
          // 添加一点延迟以确保异步处理
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      })();
      
      const [iterable1, iterable2] = forkAsyncIterable(originalIterable);
      const receivedValues1: number[] = [];
      const receivedValues2: number[] = [];
      
      // 并行迭代两个可迭代对象
      const iterationPromise1 = (async () => {
        for await (const item of iterable1) {
          receivedValues1.push(item);
        }
      })();
      
      const iterationPromise2 = (async () => {
        for await (const item of iterable2) {
          receivedValues2.push(item);
        }
      })();
      
      // 等待两个迭代都完成
      await Promise.all([iterationPromise1, iterationPromise2]);
      
      expect(receivedValues1).toEqual(originalValues);
      expect(receivedValues2).toEqual(originalValues);
    });

    test('当原始可迭代对象结束时，两个分叉的可迭代对象也应结束', async () => {
      const originalIterable = (async function* () {
        yield 'a';
        yield 'b';
      })();
      
      const [iterable1, iterable2] = forkAsyncIterable(originalIterable);
      const receivedValues1: string[] = [];
      const receivedValues2: string[] = [];
      
      const iterationPromise1 = (async () => {
        for await (const item of iterable1) {
          receivedValues1.push(item);
        }
      })();
      
      const iterationPromise2 = (async () => {
        for await (const item of iterable2) {
          receivedValues2.push(item);
        }
      })();
      
      await Promise.all([iterationPromise1, iterationPromise2]);
      
      // 验证两个可迭代对象都完成了迭代
      expect(receivedValues1).toEqual(['a', 'b']);
      expect(receivedValues2).toEqual(['a', 'b']);
    });
  });
});