import _ from "lodash";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { readUIMessageStream, type UIMessage, type UIMessageChunk } from "ai";
import { EventSourceParserStream } from "@/libs/event-source-parser";
import { appAxios } from "./appAxios";
import { parseJsonFromText } from "./fixJson";

function isReadableStream(stream: any): stream is ReadableStream {
  return stream?.pipe && typeof stream.pipe === 'function';
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

export function getJsonStreamFromAxiosResp<T = UIMessageChunk>(resp: AxiosResponse<ReadableStream>) {
  if (!isReadableStream(resp.data) && !(resp.data as any).pipeThrough) {
    throw new Error('AxiosResponse data is not a ReadableStream');
  }
  let stream = resp.data
    .pipeThrough(new TextDecoderStream())
    // .pipeThrough(new TransformStream({ // handle sse multiline format
    //   transform(chunk, controller) {
    //     const lines = chunk.split('\n').map(line => line.trim());
    //     lines.forEach(line => {
    //       if (!line || line.startsWith(':')) return;
    //       const [fieldName, ...valueParts] = line.split(/:\s?/);
    //       const value = valueParts.join(': ');
    //       if (fieldName === 'data' && value !== '[DONE]') {
    //         controller.enqueue(value);
    //       }
    //     })
    //   }
    // }))
    .pipeThrough(new EventSourceParserStream())
    .pipeThrough(new TransformStream({
      transform(chunk, controller) {
        if (!chunk.data || chunk.data?.trim() === '[DONE]') return;
        try {
          const json = JSON.parse(chunk.data) as T;
          if (json) controller.enqueue(json);
        } catch (err) {
          console.error('JSON parse error:', err, chunk.data);
        }
      }
    }));
  return stream as ReadableStream<T>;
}
export async function requestAIStream<T = any>(url, data, options?: AxiosRequestConfig & {
  axios?: AxiosInstance;
  isJson?: boolean;
  throttle?: number;
  onChange?: (chunk: T) => void;
}) {
  let { axios = appAxios, isJson = false, throttle = 40, onChange, ...opts } = options || {};
  const resp = await axios.post(url, data, {
    adapter: 'fetch', responseType: 'stream', ...opts,
  });

  const stream = getJsonStreamFromAxiosResp<UIMessageChunk>(resp);
  const msgStream = readUIMessageStream({ stream })
    .pipeThrough(createThrottledStream(throttle))
    .pipeThrough(createJsonTransform({ isJson }))
  let lastChunk: T = undefined as any;
  for await (const chunk of msgStream as any) {
    onChange?.(chunk);
    lastChunk = chunk;
  }
  return lastChunk;
}
