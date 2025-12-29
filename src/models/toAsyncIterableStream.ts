export type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

/**
 * 将 ReadableStream 转换为 AsyncIterableStream
 * 使其可用于 for-await...of 循环，并支持资源自动清理
 *
 * @param source 输入的 ReadableStream
 * @returns 转换后的 AsyncIterableStream
 */
export function toAsyncIterableStream<T>(source: ReadableStream<T>): AsyncIterableStream<T> {
  const stream = source.pipeThrough(new TransformStream<T, T>());
  (stream as AsyncIterableStream<T> as any)[Symbol.asyncIterator] = function (this: ReadableStream<T>): AsyncIterator<T> {
    const reader = this.getReader();
    let finished = false;

    async function cleanup(cancelStream: boolean) {
      finished = true;
      try {
        if (cancelStream) await reader.cancel?.();
      } finally {
        try { reader.releaseLock(); } catch { }
      }
    }

    return {
      async next(): Promise<IteratorResult<T>> {
        if (finished) return { done: true, value: undefined };
        const { done, value } = await reader.read();
        if (done) {
          await cleanup(true);
          return { done: true, value: undefined };
        }
        return { done: false, value };
      },

      async return(): Promise<IteratorResult<T>> {
        await cleanup(true);
        return { done: true, value: undefined };
      },

      async throw(err: unknown): Promise<IteratorResult<T>> {
        await cleanup(true);
        throw err;
      },
    };
  };

  return stream as AsyncIterableStream<T>;
}
