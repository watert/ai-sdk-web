import _ from 'lodash';
import { pipeUIMessageStreamToResponse, createUIMessageStream, generateText, streamText, StreamTextResult, GenerateTextResult, convertToModelMessages } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { ProxyAgent, type RequestInit as UndiciRequestInit, fetch as undiciFetch } from 'undici';
import { Response } from 'express';

const gptConfigs: any[] = [

  { // can use models: "glm-4.6:cloud", "qwen3:4b-instruct", "qwen3:4b"
    platform: 'OLLAMA', platformName: 'Ollama', apiKey: '_',
    baseURL: 'http://localhost:11434/v1',
  },
  { // can use models: "glm-4.5-flash", "glm-4.5-flash-lite"
    platform: 'GLM', platformName: 'ChatGLM', apiKey: process.env.GPT_GLM as string,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  },
  { // can use models: "qwen-plus", "qwen-turbo", "qwen-max"
    platform: 'QWEN', apiKey: process.env.GPT_QWEN as string,
    // baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // cn
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', // intl
  },
  {
    platform: 'GEMINI', platformName: 'Google Gemini', apiKey: process.env.GPT_GEMINI as string,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  }
];
const configByPlatform = _.keyBy(gptConfigs, 'platform');
// console.log('configByPlatform', configByPlatform);

// opts 应该是 generateText 的参数，但有一些扩展
type AiGenTextOpts = Parameters<typeof generateText>[0] & {
  platform: string;
  model: string; options?: any;
  search?: boolean;
  thinking?: boolean;
}
type AiGenTextStreamOpts = Parameters<typeof streamText>[0] & {
  platform: string;
  model: string; options?: any;
  search?: boolean;
  thinking?: boolean;
}
const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.https_proxy;
const proxyFetch = !proxyUrl? undefined: (input: RequestInit | URL, init?: RequestInit) => {
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
  if (platform === 'GEMINI') {
    const googleProvider = createGoogleGenerativeAI({ apiKey: opts.apiKey, fetch: proxyFetch as any })
    if (!model) model = 'gemini-2.5-flash-lite';
    return { model: googleProvider(model), info: { platform, model } };
  }
  if (!platform || typeof model !== 'string') return { model, info: { platform, model } };
  
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
    if (opts.thinking) {
      _.set(extraOpts, 'options.thinkingConfig', { includeThoughts: true });
    } else {
      _.set(extraOpts, 'options.thinkingConfig.thinkingBudget', 0);
    }
    return extraOpts;
  },
}
function prepareAiSdkRequest(opts: AiGenTextOpts | AiGenTextStreamOpts, ctx: any = {}) {
  // console.log('ctx', ctx, ctx?.abortSignal);
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
  return Object.assign(result, { info, toJSON })
}
export type AiGenTextStreamResult = StreamTextResult<any,any> & { 
  params: AiGenTextStreamOpts, info: any,
  pipeAiStreamResultToResponse: (res: Response) => void,
  toPromise: () => Promise<any>
}
export function aiGenTextStream(opts: AiGenTextStreamOpts, ctx?: any): AiGenTextStreamResult{
  
  const { params, info } = prepareAiSdkRequest(opts, ctx);
  console.log('call streamText opts', opts, 'final params', params);
  // throw 'stop';
  const resp = streamText({ ...params });
  resp.request.then(req => {
    console.log('streamText req', req);
  })
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
  return Object.assign(resp, {
    params: opts, info, toPromise,
    pipeAiStreamResultToResponse: (res: any) => pipeAiStreamResultToResponse(resp, res)
  });
}

export function pipeAiStreamResultToResponse(result: StreamTextResult<any,any>, res: Response) {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const { params, info } = result as any;
      // writer.write({ type: 'data-metadata' as any, data: info });
      writer.merge(result.toUIMessageStream({
        messageMetadata: ({ part }) => {
          // console.log('msg meta', part);
          if (part.type === 'start') {
            return { createdAt: Date.now(), ...info };
          } else if (part.type === 'start-step') {
            return { startedAt: Date.now() };
          } else if (part.type === 'finish-step') {
            const { modelId: model, id, timestamp } = part.response;
            return { usage: part.usage, model, id, timestamp, finishAt: Date.now() };
          } else if (part.type === 'finish') {
            return { totalUsage: part.totalUsage };
          }
        }
      }));
      await Promise.all([
        result.content.then(resp => {
          writer.write({ type: 'data-finish-content', data: resp });
        }),
      ]);
    }
  })
  return pipeUIMessageStreamToResponse({ response: res as any, stream });
}