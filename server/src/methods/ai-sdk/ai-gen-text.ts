import _ from 'lodash';
import { pipeUIMessageStreamToResponse, createUIMessageStream, generateText, streamText, type StreamTextResult, type GenerateTextResult, convertToModelMessages } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { jsonrepair } from 'jsonrepair';
import { ProxyAgent, type RequestInit as UndiciRequestInit, fetch as undiciFetch } from 'undici';
import { Response } from 'express';
import { gptConfigs } from './gptConfigs';

const configByPlatform = _.keyBy(gptConfigs, 'platform');

type ThinkingTypes = boolean | 'low' | 'minimal' | 'medium' | 'high';
type CommonGenOpts = {
  platform: string; model?: string; options?: any;
  search?: boolean; thinking?: ThinkingTypes;
  context?: Record<string, any>;
}
// opts 应该是 generateText 的参数，但有一些扩展
export type AiGenTextOpts = Parameters<typeof generateText>[0] & CommonGenOpts
export type AiGenTextStreamOpts = Omit<Parameters<typeof streamText>[0], 'model'> & CommonGenOpts;

export function parseJsonFromText(text: string) {
  text = text.trim()
  
  // 先尝试清理 Markdown json 代码块前面的部分
  if (text.includes('```json') && !text.startsWith('```json')) {
    text = text.slice(text.indexOf('```json') + 7, text.lastIndexOf('```'));
  }

  try {
    return JSON.parse(jsonrepair(text));
  } catch (e) {
    console.log('parse error', e);
    return undefined;
  }
}

const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.https_proxy;
export const proxyFetch = !proxyUrl? undefined: (input: RequestInit | URL, init?: RequestInit) => {
  // console.log('proxy?', {proxyUrl});
  const dispatcher = new ProxyAgent({
    uri: proxyUrl!,
    requestTls: { rejectUnauthorized: false, },
    proxyTls: { rejectUnauthorized: false, },
  });

  let url: string | URL;
  if (typeof input === 'string' || input instanceof URL) {
    url = input;
  } else if (input instanceof Request) {
    url = input.url;
  } else {
    throw new Error(`Unsupported input type: ${typeof input}`);
  }

  if (!init) {
    return undiciFetch(url, { dispatcher, });
  }

  (init as UndiciRequestInit).dispatcher = dispatcher;
  return undiciFetch(url, init as UndiciRequestInit);
}


const resolveConfigItem = (data: any) => (typeof data === 'function') ? data(): data;
export function getAISDKModel({ platform, model }: { platform?: string; model?: string }): { model: any, info: any } {
  if (platform === 'VERCEL') {
    return { model, info: { platform, model } };
  }
  const config = platform ? configByPlatform[platform] : undefined;
  if (platform && !config) throw new Error(`platform ${platform} not found`);
  const opts = {
    apiKey: resolveConfigItem(config?.apiKey),
    baseURL: resolveConfigItem(config?.baseURL),
  };
  if (!model && config?.defaultModel) model = config?.defaultModel;
  if (platform === 'GEMINI') {
    const googleProvider = createGoogleGenerativeAI({ apiKey: opts.apiKey, fetch: proxyFetch as any })
    return { model: googleProvider(model || 'gemini-2.5-flash-lite'), info: { platform, model } };
  }
  if (!platform || typeof model !== 'string') return { model, info: { platform, model } };
  if (!config?.baseURL) throw new Error(`platform ${platform} baseURL not found`);
  const provider2 = createOpenAICompatible({
    name: platform,
    apiKey: resolveConfigItem(config.apiKey),
    baseURL: resolveConfigItem(config.baseURL),
    includeUsage: true,
  });
  return { model: provider2(model), info: { platform, model } };
}

const prepareOptionsForPlatform: {
  [key: string]: (opts: Partial<AiGenTextStreamOpts | AiGenTextOpts>) => any;
  QWEN: (opts: Partial<AiGenTextStreamOpts | AiGenTextOpts>) => any;
  GEMINI: (opts: Partial<AiGenTextOpts | AiGenTextStreamOpts>) => any;
} = {
  QWEN: (opts) => {
    const extraOpts: any = {};
    if (opts.search) {
      _.set(extraOpts, 'options.enable_search', true);
      _.set(extraOpts, 'options.search_options', { enable_source: true, forced_search: true });
    }
    return extraOpts;
  },
  GEMINI: (opts) => {
    // console.log('called gemini prepare', params);
    const extraOpts: any = {};
    if (opts.search) {
      // extraOpts.tools = Object.assign({ google_search: {} }, opts.tools);
      const tool = google.tools.googleSearch({});
      extraOpts.tools = Object.assign({ google_search: tool }, opts.tools);
    }
    const isGemini3 = opts.model?.includes?.('gemini-3');
    if (isGemini3 && opts.thinking) {
      _.noop();
    } else if (isGemini3 && !opts.thinking) { // 无法禁用, 设为可能的最低
      const thinkingLevel = opts.model?.includes('-pro') ? 'low' : 'minimal';
      _.set(extraOpts, 'options.thinkingConfig', { thinkingLevel, includeThoughts: false });
    } else if (isGemini3 && opts.thinking) { // 注意: model 可能不支持相应的 level，但这里不做判断
      const thinkingLevel = opts.thinking === true ? 'low' : opts.thinking;
      _.set(extraOpts, 'options.thinkingConfig', { thinkingLevel, includeThoughts: true });
    } else if (opts.thinking) {
      _.set(extraOpts, 'options.thinkingConfig', { thinkingBudget: -1, includeThoughts: true });
    } else {
      _.set(extraOpts, 'options.thinkingConfig.thinkingBudget', 0);
    }
    return extraOpts;
  },
}
export function prepareAiSdkRequest(opts: AiGenTextOpts | AiGenTextStreamOpts, ctx: any = {}) {
  const platformOpts = prepareOptionsForPlatform[opts.platform]?.(opts) || {};
  if (platformOpts) {
    opts = _.merge({}, platformOpts, opts);
  }
  let { platform, model, options, providerOptions, messages, ...rest } = opts;
  if (messages?.length) {
    try {
      messages = convertToModelMessages(messages as any);
    } catch(err) { _.noop(); }
  }
  const modelData = getAISDKModel({ platform, model });
  if (platform && providerOptions && !providerOptions[platform]) {
    providerOptions = { [platform]: providerOptions };
  }
  if (options) {
    providerOptions = _.merge({}, providerOptions, { [platform]: options });
  }
  if (platform === 'GEMINI' && providerOptions?.GEMINI) {
    providerOptions = { google: providerOptions.GEMINI };
  }
  const params: any = { model: modelData.model, providerOptions, abortSignal: ctx?.abortSignal, messages, ...rest };
  return { ...modelData, params };
}
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
        // console.log('message-metadata', chunk);
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

export function aiHandleUIMsgMetadata({ part }: { part: any }) {
  if (part.type === 'start') {
    // console.log('msg metadata: type start')
    return { createdAt: Date.now() };
  } else if (part.type === 'start-step') {
    return { startedAt: Date.now() };
  } else if (part.type === 'finish-step') {
    const { modelId: model, id, timestamp } = part.response;
    return { usage: part.usage, model, id, timestamp, finishAt: Date.now() };
  } else if (part.type === 'finish') {
    return { totalUsage: part.totalUsage };
  }
}

export function _pipeAiStreamResultToResponse(result: StreamTextResult<any,any> & { context?: Record<string, any> }, res: Response, _metadata: any) {
  // const { metadata } = result;
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // const { params, info } = result as any;
      // console.log('result', result);
      writer.merge(result.toUIMessageStream({
        messageMetadata: aiHandleUIMsgMetadata
      }));
      // await Promise.all([
      //   result.content.then(resp => {
      //     writer.write({ type: 'data-finish-content', data: resp });
      //   }),
      // ]);
    }
  })
  return pipeUIMessageStreamToResponse({ response: res as any, stream });
}