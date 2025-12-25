import { Request, Response } from 'express';
import { isAsyncIterable } from './type-utils';
import _ from 'lodash';
import { sendEventStream } from './sendEventStream';

function isReadableStream(stream?: any) {
  return stream?.pipe && typeof stream.pipe === 'function';
}

function transformForStorage(chunk: any) {
  if (chunk instanceof Uint8Array) {
    return { __type: 'binary', data: Buffer.from(chunk).toString('base64') };
  }
  return { data: chunk };
}

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

export function createAiStreamMiddleware(fn: (bodyWithSignal: any) => any) {
  return async (req: Request, res: Response) => {
    const controller = new AbortController();
    res.on('close', () => { console.log('abort by res "close"'); controller.abort(); });
    req.on('abort', () => { console.log('abort by req "abort"'); controller.abort(); });
    
    let aiStreamResult = fn({ ...req.body, abortSignal: controller.signal });
    if (typeof aiStreamResult?.then === 'function') {
      console.log('has aiStreamResult.then, await it', await aiStreamResult);
      aiStreamResult = await aiStreamResult;
    }
    console.log('aiStreamResult', aiStreamResult);
    
    // --- return part
    
    if (aiStreamResult?.pipeAiStreamResultToResponse) {
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
