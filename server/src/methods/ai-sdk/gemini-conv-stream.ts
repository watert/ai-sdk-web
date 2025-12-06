// Gemini Conversation Stream 模块
// 用于与 Google Gemini AI 模型进行流式对话交互
// 可以应用于 Gemini AIStudio Build Mode 中

import { convertToModelMessages, readUIMessageStream, streamText, UIMessage } from "ai";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import _ from "lodash";

/**
 * 通用事件发射器类
 * @template T - 事件数据的类型
 */
export class EventEmitter<T> {
  /** 订阅者列表 */
  private subscribes: ((state: T) => void)[] = [];

  /**
   * 订阅事件
   * @param fn - 事件回调函数
   * @returns 取消订阅函数
   */
  subscribe(fn: (state: T) => void) {
    const self = this;
    this.subscribes.push(fn);
    return function unsubscribe() {
      const index = self.subscribes.indexOf(fn);
      if (index !== -1) { self.subscribes.splice(index, 1); }
    };
  }

  /**
   * 触发事件
   * @param state - 事件数据
   */
  emit(state: T) {
    this.subscribes.forEach(fn => fn(state));
  }
}

export type FetchType = typeof fetch;

export type GeminiConvStreamState = { // Gemini 对话流状态类型
  messages: UIMessage[]; // 消息列表
  streaming: boolean; // 是否正在流式传输
  thinking: boolean; // AI 是否正在思考（当最后一个部分是推理类型时）
};

export class GeminiConvStream { // Gemini 对话流类: 用于管理与 Gemini AI 模型的对话状态和流式交互
  messages: UIMessage[]; // 消息列表
  model: string; // 使用的 AI 模型名称
  apiKey: string; // API 密钥
  emitter: EventEmitter<GeminiConvStreamState>; // 事件发射器，用于通知状态变化
  fetch: FetchType | undefined; // 自定义 fetch 函数（可选）

  /**
   * 构造函数
   * @param options - 初始化选项
   * @param options.apiKey - API 密钥（可选）
   * @param options.messages - 初始消息列表
   * @param options.model - 模型名称
   * @param options.fetch - 自定义 fetch 函数（可选）
   */
  constructor({
    apiKey,
    messages = [],
    model = 'gemini-flash-latest',
    fetch
  }: {
    apiKey?: string;
    messages: UIMessage[];
    model: string;
    fetch?: FetchType;
  }) {
    this.messages = messages;
    this.model = model;
    this.apiKey = apiKey || '';
    this.emitter = new EventEmitter<GeminiConvStreamState>();
    this.fetch = fetch;
  }

  /**
   * 获取当前状态
   * @returns 当前状态
   */
  getState(): GeminiConvStreamState {
    return { messages: this.messages, streaming: false, thinking: false };
  }

  /**
   * 设置消息列表
   * @param messages - 新的消息列表
   */
  setMessages(messages: UIMessage[]) {
    this.messages = messages;
  }

  /**
   * 发送消息并处理流式响应
   * @param opts - 选项
   * @param opts.message - 要发送的消息
   * @param opts.search - 是否启用搜索工具（可选）
   * @param opts.tools - 自定义工具（可选）
   */
  async sendMessage(opts: Omit<Parameters<typeof streamText>[0], 'model'> & { message: UIMessage, search?: boolean }) {
    // 添加新消息到消息列表
    this.messages.push(opts.message);
    
    // 获取 API 密钥（优先使用实例配置的密钥，其次使用环境变量）
    const apiKey = this.apiKey || process.env.API_KEY;
    
    // 创建 Google AI 提供者
    const googleProvider = createGoogleGenerativeAI({ apiKey, fetch: this.fetch });
    
    // 确保模型名称有效
    if (!this.model) this.model = 'gemini-2.5-flash-lite';
    const model = googleProvider(this.model);
    
    // 转换消息格式
    const messages = convertToModelMessages(this.messages);
    
    // 配置工具
    let tools: any = opts.tools || {};
    if (opts.search) {
      tools = { ...tools, google_search: google.tools.googleSearch({}) };
    }
    
    // 调用 AI 模型获取流式响应
    const resp = streamText({ ...opts, model, messages, tools } as any);

    // 读取 UI 消息流
    const msgStream = readUIMessageStream({ stream: resp.toUIMessageStream() });
    
    // 处理流式响应
    for await (const msg of msgStream) {
      // 检查消息是否已存在
      const isExistMsg = this.messages.some(m => m.id === msg.id);
      if (!isExistMsg) this.messages.push(msg);
      
      // 更新消息内容
      this.messages = this.messages.map(m => m.id === msg.id ? msg : m);
      
      // 检查是否处于思考状态（当最后一个部分是推理类型时）
      const isThinking = _.last(msg.parts)?.type === 'reasoning';
      
      // 发射状态更新事件
      this.emitter.emit({ messages: this.messages, streaming: true, thinking: isThinking });
    }
  }

  /**
   * 订阅状态变化事件
   * @param fn - 状态变化回调函数
   * @returns 取消订阅函数
   */
  subscribe(fn: (state: GeminiConvStreamState) => void) {
    return this.emitter.subscribe(fn);
  }
}

/*
 * 使用示例
// 创建 GeminiConvStream 实例
const convStream = new GeminiConvStream({
  apiKey: 'your-api-key', messages: [], model: 'gemini-flash-latest'
});

// 订阅状态变化
convStream.subscribe((state) => {
  console.log('状态:', { messages: state.messages.length, streaming: state.streaming, thinking: state.thinking });
  
  // 处理思考状态
  if (state.thinking) {
    console.log('AI 正在思考...');
    // 显示思考指示器
  } else if (state.streaming) {
    const lastMessage = _.last(state.messages);
    if (lastMessage) {
      const text = lastMessage.parts.filter(p => p.type === 'text').map(p => p.text).join('');
      console.log('AI 回复:', text);
    }
  }
});

// 发送消息
await convStream.sendMessage({
  message: { id: 'user-1', role: 'user', parts: [{ type: 'text', text: '解释一下量子计算' }] }
});
*/
