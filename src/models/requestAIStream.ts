/** 
 * 调用 AI 模型, 返回流式响应
 * await requestAIStream(aiURL, params) // { text, json?, reasoning, status }
 * await requestAIStream(aiURL, params, { onChange, signal, throttle: 40, isJson: false })
 * 
 * usage example:
 * 
 * const exampleParams = {
 *   platform: 'OLLAMA',
 *   prompt: 'Respond with a JSON object: { msg: "Hello, what can I help you?" }',
 * };
 * 
 * ## in async function:
 * 
 * const { text, json } = await requestAIStream(aiURL, exampleParams);
 * console.log('resp content', { text, json });
 * 
 * ## in react
 * const [state, setState] = useState<RequestAIStreamReturn>({ text: '', json: null });
 * const abortRef = useRef<AbortController>(null);
 * const send = useCallback(async (params: AiGenTextStreamOpts) => {
 *   abortRef.current?.abort?.();
 *   abortRef.current = new AbortController();
 *   const final = await requestAIStream(aiURL, params, {
 *      onChange: setState, signal: abortRef.current.signal,
 *   });
 *   setState(final);
 * }, [aiURL]);
 * 
 */

import _ from "lodash";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { readUIMessageStream, type ReasoningUIPart, type TextUIPart, type UIMessage, type UIMessageChunk } from "ai";
import { appAxios } from "./appAxios";
import { parseJsonFromText } from "./fixJson";

function isReadableStream(stream: any): stream is ReadableStream {
  return stream?.pipe && typeof stream.pipe === 'function';
}

class TransformSSEJSONStream<T = UIMessageChunk> extends TransformStream {
  constructor() {
    super({
      transform(chunk, controller) {
        const lines = chunk.split('\n').map(line => line.trim());
        for (const line of lines) {
          if (!line || line.startsWith(':')) continue;
          const [fieldName, ...valueParts] = line.split(/: /);
          const value = valueParts.join(': ');

          if (fieldName !== 'data') continue;
          if (value === '[DONE]') break;
          try {
            const json = JSON.parse(value) as T;
            if (json) controller.enqueue(json);
          } catch (err) {
            console.error('JSON parse error:', err, value);
          }
        }
      }
    })
  }
}

function createThrottledStream(wait = 33, options = { leading: false, trailing: true }) {
  let throttledEnqueue, controller;
  return new TransformStream({
    start(ctrl) {
      controller = ctrl;
      throttledEnqueue = _.throttle((chunk) => controller.enqueue(chunk), wait, options);
    },
    transform(chunk, ctrl) { controller = ctrl; throttledEnqueue(chunk); },
    flush(ctrl) { throttledEnqueue?.flush?.(); }
  });
}
function createJsonTransform({ isJson = false, onJson }: { isJson?: boolean, onJson?: (json: any) => void } = {}) {
  let lastJson: any, json: any, shouldTryInferJsonType = true;
  const inferJsonRegexp = /(\s*```json[\s\S]*?```\s*|{\s*("[\w\d_\-\s]+"\s*:\s*|[\s\r\n]*"[\w\d_-]{2,}"\s*:\s*))/ig;

  return new TransformStream({
    async transform(chunk: UIMessage, controller) {
      const textMsg = chunk.parts.reverse().find(msg => msg.type === 'text')?.text || '';
      if (!isJson && textMsg && shouldTryInferJsonType && inferJsonRegexp.test(textMsg)) {
        isJson = true;
      }
      if (isJson) {
        json = parseJsonFromText(textMsg);
        if (json) {
          lastJson = json; onJson?.(json);
        }
      }
      controller.enqueue({ ...chunk, json: json || lastJson });
    }
  })
}
function streamMap<T, U = any>(fn: (chunk: T) => U): TransformStream<T, U> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(fn(chunk));
    }
  })
}

export function getJsonStreamFromAxiosResp<T = UIMessageChunk>(resp: AxiosResponse<ReadableStream>) {
  if (!isReadableStream(resp.data) && !(resp.data as any).pipeThrough) {
    throw new Error('AxiosResponse data is not a ReadableStream');
  }
  let stream = resp.data
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TransformSSEJSONStream<T>())
  return stream;
}
export async function* streamToAsyncIterable<T = any>(
  stream: ReadableStream<T>
): AsyncIterable<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export type RequestAIStreamReturn<T = any> = UIMessage<T> & {
  text: string, json?: any, reasoning?: string, status?: string
}
export async function requestAIStream<T = any>(url, data, options?: AxiosRequestConfig & {
  axios?: AxiosInstance;
  isJson?: boolean;
  signal?: AbortSignal;
  throttle?: number;
  onChange?: (chunk: RequestAIStreamReturn<T>) => void;
}): Promise<RequestAIStreamReturn<T>> {
  let { axios = appAxios, isJson = false, throttle = 40, signal, onChange, ...opts } = options || {};
  const resp = await axios.post(url, data, {
    adapter: 'fetch', responseType: 'stream', signal, ...opts,
  });

  const stream = getJsonStreamFromAxiosResp<UIMessageChunk>(resp);
  const msgStream = readUIMessageStream({ stream })
    .pipeThrough(createThrottledStream(throttle))
    .pipeThrough(createJsonTransform({ isJson }))
    .pipeThrough(streamMap((chunk: UIMessage<T>) => {
      const lastTextPart = _.findLast(chunk.parts, { type: 'text' }) as TextUIPart | undefined;
      const lastReasoningPart = _.findLast(chunk.parts, { type: 'reasoning' }) as ReasoningUIPart | undefined;
      return { ...chunk, text: lastTextPart?.text || '', reasoning: lastReasoningPart?.text } as RequestAIStreamReturn<T>;
    }));
  let lastChunk: RequestAIStreamReturn<T> = undefined as any;
  for await (const chunk of streamToAsyncIterable(msgStream)) {
    onChange?.(chunk);
    lastChunk = chunk;
  }
  return lastChunk;
}
