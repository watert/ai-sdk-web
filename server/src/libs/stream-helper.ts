import { Request, Response } from 'express';

export function handleAiStreamCall(fn: (options: any) => any) {
  return async (req: Request, res: Response) => {
    const controller = new AbortController();
    res.on('close', () => { controller.abort(); });
    req.on('abort', () => { controller.abort(); });
    
    const aiStreamResult = fn({ ...req.body, abortSignal: controller.signal });
    res.setHeader('Content-Type', 'text/event-stream');
    aiStreamResult.pipeAiStreamResultToResponse(res);
    await aiStreamResult.toPromise();
  };
}
