import { Request, Response } from 'express';
import { isAsyncIterable } from './type-utils';
import _ from 'lodash';
import { sendEventStream } from './sendEventStream';

function isReadableStream(stream?: any) {
  return stream?.pipe && typeof stream.pipe === 'function';
}
async function pipeAsyncIterableToResponse(iterable: AsyncIterable<any>, res: Response) {
  // res.setHeader('Content-Type', 'text/event-stream');
  await sendEventStream(res, async (send) => {
    for await (const _item of iterable) { 
      let item = _item;
      console.log('_item', _item);
      if (!item && typeof item !== 'number') continue;
      console.log('sendItem', item);
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
    
    if (aiStreamResult.pipeAiStreamResultToResponse) {
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
