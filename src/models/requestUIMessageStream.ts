// type Resolvable<T = any> = T | (() => Promise<T>);
import _ from 'lodash';
import { EventSourceParserStream, type EventSourceMessage } from '../libs/event-source-parser';
import { readUIMessageStream } from 'ai'
import type { UIMessage, UIMessageChunk } from "ai";
import { getAppReqHeaders } from './appAxios';
import { jsonrepair } from 'jsonrepair';

type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);


export interface RequestAiStreamState {
  messages: UIMessage[];
  json?: any;
}
export interface RequestAiStreamResult {
  stream: ReadableStream<UIMessageChunk>;
  subscribe: (fn: (state: RequestAiStreamState) => void) => (() => void);
  promise: Promise<RequestAiStreamState>;
  getState: () => RequestAiStreamState;
}
export interface RequestAiStreamInit {
  url: Resolvable<string>;
  method?: Resolvable<string>;
  headers?: Resolvable<Record<string, string> | Headers>;
  isJson?: boolean;
  fetch?: typeof fetch;
  body?: Resolvable<Record<string, any> | string>;
}

export class EventEmitter<T> {
  private subscribes: ((state: T) => void)[] = [];
  subscribe(fn: (state: T) => void) {
    this.subscribes.push(fn);
    return () => {
      const index = this.subscribes.indexOf(fn);
      if (index !== -1) { this.subscribes.splice(index, 1); }
    };
  }
  emit(state: T) {
    this.subscribes.forEach(fn => fn(state));
  }
}
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
export async function resolve<T>(resolvable: Resolvable<T>): Promise<T> {
  if (typeof resolvable === 'function') {
    // 区分同步和异步函数调用
    const result = (resolvable as () => T | Promise<T>)();
    return result instanceof Promise ? result : Promise.resolve(result);
  }
  return Promise.resolve(resolvable);
}
export async function requestUIMessageStream(options: RequestAiStreamInit) {
  let { url, method = 'POST', headers, body, fetch = window.fetch } = options;
  body = await resolve(body);
  if (typeof body !== 'string') {
    body = JSON.stringify(body);
  }
  headers = { ...getAppReqHeaders(), ...await resolve(headers) };
  console.log('headers', headers);
  const resp = await fetch(await resolve(url), {
    method: await resolve(method), headers, body,
  });
  if (!resp.body?.pipeThrough) {
    throw new Error('Stream is null');
  }
  const stream = resp.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .pipeThrough(
      new TransformStream<EventSourceMessage, UIMessageChunk>({
        async transform({ data }, controller) {
          if (data === '[DONE]') { return; }
          controller.enqueue(JSON.parse(data));
        },
      }),
    );

  const messages: UIMessage[] = [];
  const messagesById: Record<string, UIMessage> = {};
  const msgStream = readUIMessageStream({ stream });
  const emitter = new EventEmitter<RequestAiStreamState>();

  let lastJsonStr: any, json: any;
  let latestState: RequestAiStreamState = { messages, json };
  const getState = () => { return latestState; };
  const subscribe = (fn: (state: RequestAiStreamState) => void) => {
    const unsub = emitter.subscribe(fn);
    const state = getState();
    if (state.messages?.length) { fn(state); }
    return unsub;
  };
  const promise = (async () => {
    for await (const msg of msgStream) {
      const { id } = msg;
      if (!messagesById[id]) {
        messages.push(msg);
        messagesById[id] = msg;
      } else {
        Object.assign(messagesById[id], msg);
      }

      if (options.isJson) {
        const lastTextMsg = _.findLast(messages.flatMap(msg => msg.parts), msg => msg.type === 'text');
        if (lastTextMsg && lastTextMsg?.text !== lastJsonStr) {
          json = parseJsonFromText(lastTextMsg?.text || 'undefined');
          lastJsonStr = lastTextMsg?.text || 'undefined';
        }
      }
      latestState = { json, messages };
      emitter.emit(latestState);
    }
    return latestState;
  })();
  
  return { stream: msgStream, subscribe, promise, getState };
}
