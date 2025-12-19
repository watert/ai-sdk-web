import _ from 'lodash';
import { pipeUIMessageStreamToResponse,
  createUIMessageStream,
  generateText, streamText,
  type StreamTextResult, type GenerateTextResult,
} from 'ai';
import { Response } from 'express';
import { AiGenTextOpts, prepareAiSdkRequest, parseJsonFromText, AiGenTextStreamOpts, aiHandleUIMsgMetadata } from './ai-sdk-utils';


export async function aiGenText(this: any, opts: AiGenTextOpts): Promise<GenerateTextResult<any, any> & {
  toJSON: () => any;
  toJsonFormat: () => any;
}> {
  const { params, info } = prepareAiSdkRequest(opts, this);
  const result = await generateText(params);

  const pickFields = ['text', 'content', 'reasoning', 'reasoningText', 'files', 'sources', 'toolCalls', 'toolResults', 'finishReason', 'usage', 'totalUsage', 'warnings'];
  const toJSON = () => ({
    ..._.pick(result, pickFields),
    ..._.pick(result.response, 'id', 'timestamp'),
    model: result.response?.modelId,
    metadata: result.providerMetadata,
  });
  function toJsonFormat() {
    return parseJsonFromText(result.text);
  }
  return Object.assign(result, { info, toJSON, toJsonFormat })
}
export type AiGenTextStreamResult = StreamTextResult<any,any> & { 
  params: AiGenTextStreamOpts, info: any,
  pipeAiStreamResultToResponse: (res: Response) => void,
  toPromise: () => Promise<any>,
  toJsonFormat: () => Promise<any>;
}
export function aiGenTextStream(opts: AiGenTextStreamOpts, ctx?: any): AiGenTextStreamResult{
  const { params, info } = prepareAiSdkRequest(opts, ctx);
  let context: any = { metadata: {}, ...(opts.experimental_context as any) || {}, ...opts.context };
  const resp = streamText({
    experimental_context: context,
    ..._.omit(params, 'search', 'thinking') as any,
  });
  
  (async () => {
    for await (const chunk of resp.toUIMessageStream({
      messageMetadata: aiHandleUIMsgMetadata
    })) {
      if (chunk.type === 'message-metadata') {
        Object.assign(context.metadata, chunk.messageMetadata || {});
      }
    }
  })();
  const toPromise = async () => {
    return {
      text: await resp.text,
      reasoningText: await resp.reasoningText,
      messages: (await resp.response).messages,
      usage: await resp.usage,
      totalUsage: await resp.totalUsage,
      providerMetadata: await resp.providerMetadata,
    };
  }
  const toJsonFormat = async () => {
    return parseJsonFromText(await resp.text);
  }
  const pipeAiStreamResultToResponse = (res: any) => {
    return _pipeAiStreamResultToResponse(resp, res, context)
  }
  
  return Object.assign(resp, {
    params: opts, info, toPromise, toJsonFormat,
    pipeAiStreamResultToResponse,
  });
}

export function _pipeAiStreamResultToResponse(result: StreamTextResult<any,any> & { context?: Record<string, any> }, res: Response, _metadata: any) {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(result.toUIMessageStream({
        messageMetadata: aiHandleUIMsgMetadata
      }));
    }
  })
  return pipeUIMessageStreamToResponse({ response: res as any, stream });
}