import _ from "lodash";
import { makeAsyncIterable, makeIterable } from "./makeAsyncIterable";
import asyncWait from "./asyncWait";

describe('makeAsyncIterable', () => {
  it('test async iterable with await result', async () => {
    const genFn = async function* () {
      for (let i = 0; i < 5; i++) {
        yield JSON.stringify(i);
      }
    };
    console.log('genFn()', genFn())
    console.log('await genFn()', await genFn())
  })
  it('should check iterable or promise type', () => {
    function getRespType(result: any): ('promise' | 'iterable' | string) {
      if (result instanceof Promise) {
        return 'promise';
      }
      if (typeof result?.[Symbol.asyncIterator] === 'function') {
        return 'iterable';
      }
      // if (typeof result === 'function') return 'function';
      return typeof result;
    }
    // expect(getRespType({})).toBe('normal');
    expect(getRespType(Promise.resolve({}))).toBe('promise');
    expect(getRespType((async () => { return true })())).toBe('promise');
    const it = makeIterable();
    const iterable = it.start();
    expect(getRespType(iterable)).toBe('iterable');
  });
  it('makeIterable', async () => {
    const it = makeIterable();
    it.start();
    const result: any[] = [];
    (async () => {
      for (let i = 0; i < 5; i++) {
        await it.yieldItem(JSON.stringify(i)); await asyncWait(0);
      }
      it.end();
    })();
    for await (const item of it.getIterable()) {
      result.push(item);
    }
    expect(result).toEqual(['0', '1', '2', '3', '4']);
  });
  it('makeAsyncIterable', async () => {
    const iterable = makeAsyncIterable(async (onChange) => {
      for (let i = 0; i < 5; i++) {
        onChange(JSON.stringify(i)); await asyncWait(200);
      }
      return '[DONE]';
    });
    const result: any[] = [];
    for await (const item of iterable) {
      result.push(item);
    }
    expect(result).toEqual(['0', '1', '2', '3', '4', '[DONE]']);
  });
});