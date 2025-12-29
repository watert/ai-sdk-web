import _ from 'lodash';
import { Request, RequestHandler, Response } from 'express';
import { sendEventStream } from './sendEventStream';
import { AsyncIterableStream } from 'ai';

function isReadableStream(stream?: any) {
  return stream?.pipe && typeof stream.pipe === 'function';
}
function isAsyncIterable(value: any): boolean {
  return typeof value?.[Symbol.asyncIterator] === 'function';
}
/**
 * 将一个异步可迭代对象分叉为多个独立的异步可迭代对象。
 * 共享同一个源，支持背压，自动回收已消费的内存。
 *
 * @param source 原始的异步可迭代对象
 * @param count 需要分叉的数量 (默认为 2)
 */
export function forkAsyncIterable<T>(
  source: AsyncIterable<T>,
  count: number = 2
): AsyncIterable<T>[] {
  // 获取源迭代器
  const iterator = source[Symbol.asyncIterator]();
  const buffer: IteratorResult<T>[] = []; // 共享的缓冲区，存储 { done, value }
  let sourceEnded = false; // 记录源是否已经通过 return/throw 结束
  const cursors = new Array(count).fill(0); // 每一个分叉当前的读取位置（指针）
  let fetchPromise: Promise<void> | null = null; // 用于防止多个分叉同时触发源的 next()

  const ensureAvailable = async (index: number) => { // 核心拉取逻辑：确保缓冲区里有 index 位置的数据
    if (index < buffer.length) return; // 如果需要的索引已经在缓冲区内，直接返回
    if (sourceEnded) return; // 如果源已经结束且缓冲区不够，说明没有更多数据了
    
    if (fetchPromise) { // 如果当前已经有一个拉取请求在进行中，复用它（避免重复拉取）
      await fetchPromise;
      await ensureAvailable(index);  // 递归检查，因为等待的那个 promise 结束后，数据可能正好够了，也可能还不够
      return;
    }
    fetchPromise = (async () => { // 创建新的拉取锁
      try {
        const result = await iterator.next();
        buffer.push(result);
        if (result.done) { sourceEnded = true; }
      } finally {
        fetchPromise = null;
      }
    })();

    await fetchPromise;
  };

  // 尝试清理缓冲区：如果所有分叉都读取了前面的数据，就扔掉
  const tryCleanup = () => {
    const minCursor = Math.min(...cursors); // 找到所有分叉中进度最慢的那个 (最小的索引)
    
    if (minCursor > 0) {
      buffer.splice(0, minCursor); // 从缓冲区头部移除已被所有分叉消费的数据
      for (let i = 0; i < count; i++) { // 将所有分叉的指针减去移除的数量，保持相对位置正确
        cursors[i] -= minCursor;
      }
    }
  };

  // 生成分叉的方法
  const createFork = (forkIndex: number): AsyncIterable<T> => {
    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            await ensureAvailable(cursors[forkIndex]); // 1. 确保存储区里有当前指针指向的数据
            const currentIdx = cursors[forkIndex], result = buffer[currentIdx]; // 2. 获取数据
            if (!result) { // 3. 如果拿不到数据，说明源结束了，且缓冲区也空了
              return { done: true, value: undefined };
            }
            cursors[forkIndex]++; // 4. 移动指针
            tryCleanup(); // 5. 尝试垃圾回收 (关键步骤，防止内存泄漏)
            return result; // 6. 返回数据的副本（如果是对象，引用还是共享的，符合 JS 行为）
          },
          
          async return(value?: any) { // 可选：实现 return 以处理 break 等提前退出的情况
             // 简单的处理：如果该分支退出了，我们可以把它的指针设为无限大，这样它就不会阻碍垃圾回收了。
             cursors[forkIndex] = Infinity;
             tryCleanup();
             return { done: true, value };
          }
        };
      },
    };
  };
  // 返回指定数量的分叉
  return Array.from({ length: count }, (_, i) => createFork(i));
}

// async function streamWithCache<T = any>(cacheKey: string, fn: () => AsyncIterable<T>) {
//   return mongoCache(cacheKey, async () => {
//     return fn();
//   })
//   const [iterable, iterable2] = forkAsyncIterable(fn());
//   return iterable;
// }

// function transformForStorage(chunk: any) {
//   if (chunk instanceof Uint8Array) {
//     return { __type: 'binary', data: Buffer.from(chunk).toString('base64') };
//   }
//   return { data: chunk };
// }

export type ExportStreamChunk<T = any> = { chunk: T, __type?: 'binary', ts: number }; // ts is based on start time, ms unit
export type ExportStreamResult<T = any> = { chunks: ExportStreamChunk<T>[], startTime: Date };

export async function exportStream<T>(stream: AsyncIterable<T>, opts: { onChunk?: (chunk: T) => void, maxChunks?: number } = {}): Promise<ExportStreamResult<T>> {
  const startTime = Date.now();
  const max = opts.maxChunks ?? 500;
  const chunks: ExportStreamChunk<T>[] = [];
  for await (const val of stream) {
    if (chunks.length >= max) {
      console.warn("Reached max chunks limit, stopping export."); break;
    }
    chunks.push({ chunk: val, ts: Date.now() - startTime, });
    opts.onChunk?.(val);
  }
  return { chunks, startTime: new Date(startTime ) };
}

/**
 * 将导出的数据恢复为异步流
 */
export async function* recoverExportedStream<T>(
  result: { chunks: ExportStreamChunk<T>[] },
  options: { speed?: number } = {}
): AsyncIterable<T> {
  const { chunks } = result;
  const speed = options.speed ?? 1;

  for (let i = 0; i < chunks.length; i++) {
    const current = chunks[i];
    const previousTs = i === 0 ? 0 : chunks[i - 1].ts;
    const delay = (current.ts - previousTs) / speed;
    if (delay > 0) { await new Promise(resolve => setTimeout(resolve, delay)); }
    yield current.chunk;
  }
}

async function pipeAsyncIterableToResponse(iterable: AsyncIterable<any>, res: Response) {
  await sendEventStream(res, async (send) => {
    for await (const _item of iterable) { 
      let item = _item;
      // console.log('_item', _item);
      if (!item && typeof item !== 'number') continue;
      // console.log('sendItem', item);
      send(item);
    }
  });
  res.end();
}


export function createAiStreamMiddleware(fn: (bodyWithSignal: any) => any): RequestHandler;
export function createAiStreamMiddleware(fn: (body: any, { signal, req, res }: { signal?: AbortSignal, req: Request, res: Response }) => any): RequestHandler {
  return async (req: Request, res: Response) => {
    const controller = new AbortController();
    res.on('close', () => { console.log('abort by res "close"'); controller.abort(); });
    req.on('abort', () => { console.log('abort by req "abort"'); controller.abort(); });
    
    let bodyData = req.method === 'GET' ? req.query : req.body;
    const hasArg2 = fn.length > 1;
    if (!hasArg2) bodyData = { ...bodyData, abortSignal: controller.signal };
    let aiStreamResult = fn(bodyData, { signal: controller.signal, req, res });
    
    if (typeof aiStreamResult?.then === 'function') { // promise type
      console.log('has aiStreamResult.then, await it', await aiStreamResult);
      aiStreamResult = await aiStreamResult;
    }
    console.log('aiStreamResult', aiStreamResult);
    
    if (aiStreamResult?.pipeAiStreamResultToResponse) { // customed type
      console.log('call pipeAiStreamResultToResponse');
      res.setHeader('Content-Type', 'text/event-stream');
      aiStreamResult.pipeAiStreamResultToResponse(res);
      await aiStreamResult.toPromise().catch(err => {
        console.log('pipeAiStreamResultToResponse error', err);
      });
      return;
    }
    if (isAsyncIterable(aiStreamResult)) {
      console.log('isAsyncIterable', aiStreamResult);
      res.setHeader('Content-Type', 'text/event-stream');
      await pipeAsyncIterableToResponse(aiStreamResult, res);
      return;
    }
    if (!isReadableStream(aiStreamResult)) {
      res.setHeader('Content-Type', 'application/json');
      res.json({ data: aiStreamResult });
      return;
    }
    res.status(500).json({ error: 'Invalid stream result' });
  };
}
export const resStreamOut = createAiStreamMiddleware;


export function streamFromAsyncIterable<T>(iterable: AsyncIterable<T>): ReadableStream<T> {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const item of iterable) {
          controller.enqueue(item);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}


// type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;
export function toAsyncIterableStream<T>(
  source: ReadableStream<T>,
): AsyncIterableStream<T> {
  const stream = source.pipeThrough(new TransformStream<T, T>());
  (stream as AsyncIterableStream<T> as any)[Symbol.asyncIterator] = function (
    this: ReadableStream<T>,
  ): AsyncIterator<T> {
    const reader = this.getReader();

    let finished = false;

    /**
     * Cleans up the reader by cancelling and releasing the lock.
     */
    async function cleanup(cancelStream: boolean) {
      finished = true;
      try {
        if (cancelStream) {
          await reader.cancel?.();
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {}
      }
    }

    return {
      /**
       * Reads the next chunk from the stream.
       * @returns A promise resolving to the next IteratorResult.
       */
      async next(): Promise<IteratorResult<T>> {
        if (finished) {
          return { done: true, value: undefined };
        }

        const { done, value } = await reader.read();

        if (done) {
          await cleanup(true);
          return { done: true, value: undefined };
        }

        return { done: false, value };
      },

      /**
       * Called on early exit (e.g., break from for-await).
       * Ensures the stream is cancelled and resources are released.
       * @returns A promise resolving to a completed IteratorResult.
       */
      async return(): Promise<IteratorResult<T>> {
        await cleanup(true);
        return { done: true, value: undefined };
      },

      /**
       * Called on early exit with error.
       * Ensures the stream is cancelled and resources are released, then rethrows the error.
       * @param err The error to throw.
       * @returns A promise that rejects with the provided error.
       */
      async throw(err: unknown): Promise<IteratorResult<T>> {
        await cleanup(true);
        throw err;
      },
    };
  };

  return stream as AsyncIterableStream<T>;
}