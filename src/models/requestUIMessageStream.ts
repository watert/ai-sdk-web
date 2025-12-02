/**
 * @file requestUIMessageStream.ts
 * @description 用于处理 AI 流式消息请求的核心模块，提供了 requestUIMessageStream 函数和相关类型定义
 * 该模块封装了 AI 流式请求的处理逻辑，支持自动解析 JSON 响应，提供状态管理和订阅机制
 * 
 * @example
 * // 基础用法
 * import { requestUIMessageStream } from 'models/requestUIMessageStream';
 * 
 * const result = await requestUIMessageStream({
 *   url: 'http://localhost:5178/api/dev/ai-gen-stream',
 *   body: {
 *     platform: 'OLLAMA',
 *     model: 'qwen3:4b-instruct',
 *     prompt: 'Hello, world!'
 *   }
 * });
 * 
 * // 订阅状态变化
 * const unsubscribe = result.subscribe(state => {
 *   console.log('Stream state:', state);
 * });
 * 
 * // 取消请求
 * result.abort();
 * 
 * @example
 * // 在 React 中使用 hooks（基于实际演示页面）
 * import React from 'react';
 * import { useAsyncSubscriberFn } from 'hooks/useAsyncSubscriber';
 * import { requestUIMessageStream } from 'models/requestUIMessageStream';
 * 
 * // 使用自定义 hook 订阅 AI 流，支持状态自动更新
 * const [state, sendRequest, abort] = useAsyncSubscriberFn(async () => {
 *   return await requestUIMessageStream({
 *     url: 'http://localhost:5178/api/dev/ai-gen-stream',
 *     body: {
 *       platform: 'OLLAMA', 
 *       model: 'qwen3:4b-instruct',
 *       prompt: 'Respond with a JSON object: { msg: "Hello, what can I help you?" }'
 *     }
 *   });
 * }, []);
 */

import _ from 'lodash';
import { EventSourceParserStream, type EventSourceMessage } from '../libs/event-source-parser';
import { readUIMessageStream } from 'ai'
import type { UIMessage, UIMessageChunk } from "ai";
import { getAppReqHeaders } from './appAxios';
import { jsonrepair } from 'jsonrepair';

/**
 * 可解析类型，支持直接值、Promise 和函数返回值
 */
type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);

/**
 * AI 对话状态枚举
 */
type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';
/**
 * AI 流式请求状态接口，包含对话的完整状态信息
 */
export interface RequestAiStreamState {
  /** 对话消息列表 */
  messages: UIMessage[];
  /** 解析后的JSON数据（如果响应包含JSON格式内容） */
  json?: any;
  /** 对话状态：submitted(已提交)、streaming(流式传输中)、ready(完成)、error(错误) */
  status: ChatStatus;
  /** 错误信息（仅在 status 为 error 时存在） */
  error?: any;
  /** 事件信息 */
  event?: any;
  /** 是否完成 */
  isDone?: boolean;
  /** 完整文本内容 */
  text?: string;
  /** 停止原因 */
  stopReason?: string;
  /** 元数据 */
  meta?: any;
}
/**
 * AI 流式请求结果接口，包含流处理相关的方法和属性
 */
export interface RequestAiStreamResult {
  /** 原始ReadableStream流 */
  stream: ReadableStream<UIMessageChunk>;
  /** 订阅状态变化的方法，返回取消订阅的函数 */
  subscribe: (fn: (state: RequestAiStreamState) => void) => (() => void);
  /** 流处理完成后的Promise，resolve为最终状态 */
  promise: Promise<RequestAiStreamState>;
  /** 获取当前状态的方法 */
  getState: () => RequestAiStreamState;
  /** 取消请求的方法 */
  abort: () => void;
}
/**
 * AI 流式请求初始化配置接口
 */
export interface RequestAiStreamInit {
  /** 请求URL，支持直接值、Promise或函数返回值 */
  url: Resolvable<string>;
  /** 请求方法，默认POST，支持直接值、Promise或函数返回值 */
  method?: Resolvable<string>;
  /** 请求头，支持直接值、Promise或函数返回值 */
  headers?: Resolvable<Record<string, string> | Headers>;
  /** 是否强制解析为JSON，默认false */
  isJson?: boolean;
  /** 自定义fetch函数，默认使用window.fetch */
  fetch?: typeof fetch;
  /** 请求体，支持直接值、Promise或函数返回值 */
  body?: Resolvable<Record<string, any> | string>;
  /** 状态更新节流时间（毫秒），默认33ms */
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
/**
 * 创建一个请求AI流的函数，用于处理流式响应
 * 
 * @param options 请求配置选项
 * @returns 返回一个包含流、订阅、获取状态、取消请求和Promise的对象
 * 
 * @example
 * // 基础用法
 * const result = await requestUIMessageStream({
 *   url: 'http://localhost:5178/api/dev/ai-gen-stream',
 *   body: {
 *     platform: 'OLLAMA',
 *     model: 'qwen3:4b-instruct',
 *     prompt: 'Hello, world!'
 *   }
 * });
 * 
 * // 订阅状态变化
 * const unsubscribe = result.subscribe(state => {
 *   console.log('Stream state:', state);
 * });
 * 
 * // 取消请求
 * result.abort();
 * 
 * @example
 * // 带节流配置的用法
 * const result = await requestUIMessageStream({
 *   url: 'http://localhost:5178/api/dev/ai-gen-stream',
 *   body: { platform: 'OLLAMA', model: 'qwen3:4b-instruct', prompt: 'Hello' },
 *   throttle: 100 // 每100ms更新一次状态
 * });
 */
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
