// type Resolvable<T = any> = T | (() => Promise<T>);
import _ from 'lodash';
import { EventSourceParserStream, type EventSourceMessage } from '../libs/event-source-parser';
import { readUIMessageStream } from 'ai'
import type { UIMessage, UIMessageChunk } from "ai";
import { getAppReqHeaders } from './appAxios';
import { jsonrepair } from 'jsonrepair';

type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);

type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';
export interface RequestAiStreamState {
  messages: UIMessage[];
  json?: any;
  status: ChatStatus;
}
export interface RequestAiStreamResult {
  stream: ReadableStream<UIMessageChunk>;
  subscribe: (fn: (state: RequestAiStreamState) => void) => (() => void);
  promise: Promise<RequestAiStreamState>;
  getState: () => RequestAiStreamState;
  abort: () => void;
}
export interface RequestAiStreamInit {
  url: Resolvable<string>;
  method?: Resolvable<string>;
  headers?: Resolvable<Record<string, string> | Headers>;
  isJson?: boolean;
  fetch?: typeof fetch;
  body?: Resolvable<Record<string, any> | string>;
  throttle?: number;
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
    const lastJsonTokens = ['```', '}', ']']
    const { tokenStr, index } = lastJsonTokens.reduce((prev, cur) => {
      const index = text.lastIndexOf(cur);
      return index !== -1 && (prev.index === -1 || index > prev.index) ? { tokenStr: cur, index } : prev;
    }, { tokenStr: '', index: -1 });
    if (index !== -1) {
      text = text.slice(0, index + tokenStr.length);
    }
    try {
      return JSON.parse(jsonrepair(text));
    } catch (e) {
      console.log('parse error', e);
      return undefined;
    }
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
  let { url, method = 'POST', headers, body, fetch = window.fetch, throttle = 33 } = options;
  body = await resolve(body);
  if (typeof body !== 'string') {
    body = JSON.stringify(body);
  }
  headers = { ...getAppReqHeaders(), ...await resolve(headers) };
  // console.log('headers', headers);
  
  // 创建 AbortController 用于支持取消请求
  const controller = new AbortController();
  const { signal } = controller;
  
  const resp = await fetch(await resolve(url), {    method: await resolve(method), headers, body, signal  });
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
  // 初始化状态为 'submitted'，表示请求已提交
  let latestState: RequestAiStreamState = { messages, json, status: 'submitted' };
  
  // 使用 lodash throttle 创建节流的 emit 函数
  const throttledEmit = _.throttle((state: RequestAiStreamState) => {
    emitter.emit(state);
  }, throttle);
  
  const getState = () => { return latestState; };
  const subscribe = (fn: (state: RequestAiStreamState) => void) => {
    console.count('called subscribe');
    const unsub = emitter.subscribe(fn);
    const state = getState();
    if (state.messages?.length) { fn(state); }
    return unsub;
  };
  
  // 实现 abort 函数
  const abort = () => {
    controller.abort();
    // 更新状态为 'ready' 表示可以发起新请求
    latestState = { ...latestState, status: 'ready' };
    // 取消节流，立即 emit 最终状态
    throttledEmit.cancel();
    emitter.emit(latestState);
    // _.last(messages)?.parts?.push({ type: 'abort' });
  };
  
  let isJson = options.isJson || false, shouldTryInferJsonType = true;
  const inferJsonRegexp = /(\s*```json[\s\S]*?```\s*|{\s*("[\w\d_\-\s]+"\s*:\s*|[\s\r\n]*"[\w\d_-]{2,}"\s*:\s*))/ig;
  const promise = (async () => {
    try {
      // 开始接收流数据，更新状态为 'streaming'
      latestState = { ...latestState, status: 'streaming' };
      throttledEmit(latestState);
      
      for await (const msg of msgStream) {
        const { id } = msg;
        if (!messagesById[id]) {
          messages.push(msg);
          messagesById[id] = msg;
        } else {
          Object.assign(messagesById[id], msg);
        }

        
        const lastTextMsg = _.findLast(messages.flatMap(msg => msg.parts), msg => msg.type === 'text');
        if (!isJson && lastTextMsg?.text && shouldTryInferJsonType && inferJsonRegexp.test(lastTextMsg?.text)) {
          // console.log('matched auto retry', lastTextMsg, parseJsonFromText(lastTextMsg?.text || 'undefined'));
          isJson = true;
        }
        if (isJson) {
          if (lastTextMsg && lastTextMsg?.text !== lastJsonStr) {
            try {

              json = parseJsonFromText(lastTextMsg?.text || 'undefined');
              lastJsonStr = lastTextMsg?.text || 'undefined';
            } catch(err) {
              if (!options.isJson && shouldTryInferJsonType) {
                isJson = false;
                shouldTryInferJsonType = false;
              }
            }
          }
        }
        latestState = { json, messages, status: 'streaming' };
        throttledEmit(latestState);
      }
      
      // 流结束，更新状态为 'ready'
      latestState = { ...latestState, status: 'ready' };
      // 取消节流，立即 emit 最终状态
      throttledEmit.cancel();
      emitter.emit(latestState);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Stream error:', error);
        // 发生错误，更新状态为 'error'
        latestState = { ...latestState, status: 'error' };
        // 取消节流，立即 emit 错误状态
        throttledEmit.cancel();
        emitter.emit(latestState);
      }
    }
    return latestState;
  })();
  
  return { stream: msgStream, subscribe, promise, getState, abort };
}
