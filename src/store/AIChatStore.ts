import _ from 'lodash';
import type { ChatStatus, ToolSet, UIMessage } from 'ai';
import { convertFileListToFileUIParts, readUIMessageStream, streamText, convertToModelMessages, type StreamTextResult } from 'ai';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const env = typeof process !== 'undefined' ? process.env : {};
const defaultConfig = {
  platform: 'GEMINI' as const, fetch: globalThis.fetch,
  apiKey: typeof process !== 'undefined' ? (env.GPT_GEMINI || env.API_KEY) : '', // compatible with aistudio build mode
}
export interface AIChatStateConfig {
  fetch?: typeof fetch;
  platform?: 'GEMINI' | 'OLLAMA' | 'OPENROUTER';
  model?: string | any;
  enableSearch?: boolean;
  options?: any;
  tools?: ToolSet;
  apiKey?: string; // ollama not needed
}

export interface AIChatStoreState {
  config?: AIChatStateConfig;
  messages: UIMessage<any>[];
  error: Error | null;
  status: ChatStatus;
}

/**
AI 聊天状态存储类, 用于管理 AI 聊天会话的状态和配置. usage:

```ts
const store = new AIChatStore({ platform: 'GEMINI', model: 'gemini-3-flash-preview', apiKey: 'your-api-key', enableSearch: false });
store.sendMessage({ text: '你好' }).then(() => {
  console.log('send message done', store.getState());
});
store.subscribe(() => { // can be used with React.useSyncExternalStore
  console.log('state', store.getState());
});
```

 */
export class AIChatStore {
  private config: AIChatStateConfig;
  private messages: UIMessage<any>[] = [];
  private error: Error | null = null;
  private status: ChatStatus = 'ready';
  private emitter: EventEmitter<AIChatStoreState>;
  private controller: AbortController | null = null;
  private throttledEmit: (state: AIChatStoreState) => void;

  constructor(config: AIChatStateConfig) {
    this.config = { ...defaultConfig, ...config };
    this.initializeModel();
    this.emitter = new EventEmitter<AIChatStoreState>();
    this.throttledEmit = _.throttle((state) => {
      this.emitter.emit(state);
    }, 33);
  }

  setConfig(config: AIChatStateConfig) {
    this.config = { ...this.config, ...config };
    this.initializeModel();
  }

  private initializeModel() {
    let { model, platform, tools, apiKey, fetch, enableSearch } = this.config;
    if (platform === 'GEMINI') {
      const googleProvider = createGoogleGenerativeAI({ apiKey, fetch });
      this.config.model = googleProvider(model || 'gemini-3-flash-preview');
      if (enableSearch) {
        const google_search = google.tools.googleSearch({});
        this.config.tools = { ...tools || {}, google_search: google_search as any, };
      }
    } else if (platform === 'OLLAMA') {
      const ollamaProvider = createOpenAICompatible({ name: platform, baseURL: 'http://localhost:11434/v1', apiKey: apiKey || '_', fetch });
      this.config.model = ollamaProvider(model || 'qwen3:4b-instruct');
    } else if (platform === 'OPENROUTER') {
      const openRouterProvider = createOpenAICompatible({ name: platform, apiKey: apiKey || '_', baseURL: 'https://openrouter.ai/api/v1', fetch });
      this.config.model = openRouterProvider(model || 'openai/gpt-oss-20b:free');
    }
  }

  public getState(): AIChatStoreState {
    const { config, messages, error, status } = this;
    return { config, messages, error, status };
  }
  private updateState(updates: Partial<AIChatStoreState>) {
    Object.assign(this, updates);
    this.throttledEmit(this.getState());
  }
  static async createUIMessage(msg: UIMessage | string | {
    role?: 'user' | 'assistant';
    text?: string;
    files?: File[];
  }): Promise<UIMessage> {
    if (typeof msg === 'string') {
      return {
        id: genId(), role: 'user',
        parts: [{ type: 'text', text: msg }],
      };
    } else if (typeof msg !== 'string' && ('text' in msg || 'files' in msg)) {
      const fileParts = Array.isArray(msg.files)
        ? msg.files
        : await convertFileListToFileUIParts(msg.files);
      return {
        id: genId(), role: msg.role || 'user',
        parts: [
          ...fileParts as any,
          ...(msg.text ? [{ type: 'text', text: msg.text || '' }] : []),
        ],
      };
    }
    if (!(msg as UIMessage).id) { (msg as any).id = genId(); }
    return msg as UIMessage;
  }
  sendMessage = async (message: UIMessage | string | {
    role?: 'user' | 'assistant';
    text?: string;
    files?: File[];
  }) => {
    if (this.status === 'streaming') { return; }

    try {
      this.updateState({ status: 'submitted' });
      this.controller = new AbortController();
      const { signal } = this.controller;

      const userMessage = await AIChatStore.createUIMessage(message);

      this.messages.push(userMessage);
      this.updateState({ messages: this.messages, status: 'streaming' });

      const providerKey = this.config.platform === 'GEMINI' ? 'google': this.config.platform;
      const streamResult: StreamTextResult<any, any> = await streamText({
        model: this.config.model,
        messages: convertToModelMessages(this.messages as any),
        providerOptions: !providerKey ? {}: {
          [providerKey]: this.config.options,
        },
        tools: this.config.tools || {},
        abortSignal: signal,
      });

      const chunkStream = streamResult.toUIMessageStream();
      const uiMsgStream = readUIMessageStream({ stream: chunkStream });
      // 逐块处理流数据
      for await (const msg of uiMsgStream) {
        console.log('uiMsgStream chunk', msg);
        if (this.lastMessage()?.id !== msg.id) {
          this.messages.push(msg);
        } else {
          this.messages = [...this.messages.slice(0, this.messages.length - 1), msg];
        }
        this.updateState({ messages: this.messages });
      }

      this.updateState({ status: 'ready' });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.updateState({ error: error as Error, status: 'error' });
      }
    }
  };

  regenerate = async (messageId: string) => {
    const messageIndex = this.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) { return; }

    this.messages = this.messages.slice(0, messageIndex);
    this.updateState({ messages: this.messages, status: 'ready' });

    const lastUserMessage = _.findLast(this.messages, m => m.role === 'user');
    if (lastUserMessage?.parts[0]?.type === 'text') {
      await this.sendMessage(lastUserMessage.parts[0].text);
    }
  };
  lastMessage = () => _.last(this.messages);
  setMessages = (messages: UIMessage<any>[]) => { this.updateState({ messages }); };

  stop = () => {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this.updateState({ status: 'ready' });
  };

  subscribe = (fn: (state: AIChatStoreState) => void) => {
    const unsub = this.emitter.subscribe(fn);
    fn(this.getState());
    return unsub;
  };

  getStatePublic = () => this.getState();
}
function genId() { return Math.random().toString(36).substring(2) + Date.now().toString(16); }
class EventEmitter<T> {
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