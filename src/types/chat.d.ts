// 聊天消息类型定义 - 基于 AI SDK 类型系统设计
// 示例用法：
// import { ChatMessage, MessageMetadata } from './types/chat';
// const message: ChatMessage<MessageMetadata> = {
//   id: 'msg_123',
//   role: 'user',
//   parts: [{ type: 'text', text: 'Hello, how are you?' }],
//   metadata: {
//     platform: 'GLM',
//     model: 'glm-4.5-flash',
//     usage: { inputTokens: 14, outputTokens: 324, totalTokens: 338 }
//   }
// };

// 令牌使用情况类型
export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
  [key: string]: any; // 兼容后续可能添加的字段
}

// 消息元数据类型 - 基于示例设计，支持逐步补充字段
export interface MessageMetadata {
  /** 消息创建时间戳（毫秒） */
  createdAt?: number;
  /** AI平台名称 */
  platform?: string;
  /** 使用的模型名称 */
  model?: string;
  /** 单次使用情况 */
  usage?: TokenUsage;
  /** 消息ID */
  id?: string;
  /** 消息时间戳（ISO格式） */
  timestamp?: string;
  /** 总使用情况 */
  totalUsage?: TokenUsage;
  [key: string]: any; // 兼容后续可能添加的字段
}

// 基础消息部分类型
export interface TextPart {
  type: 'text';
  text: string;
}

export interface ReasoningPart {
  type: 'reasoning';
  text: string;
}

export interface ImagePart {
  type: 'image';
  base64: string;
  mimeType: string;
}

export interface FilePart {
  type: 'file';
  name: string;
  url: string;
  mimeType: string;
}

// 工具相关部分类型
export interface ToolCallPart {
  type: 'tool-call';
  id: string;
  toolName: string;
  args: Record<string, any>;
}

export interface ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  result: any;
  error?: string;
}

// 消息部分联合类型
export type ChatMessagePart = 
  | TextPart 
  | ReasoningPart 
  | ImagePart 
  | FilePart 
  | ToolCallPart 
  | ToolResultPart 
  | { type: string; text?: string; [key: string]: any }; // 兼容自定义类型

// 核心消息类型 - 支持泛型元数据扩展
export interface ChatMessage<M = MessageMetadata> {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  parts: ChatMessagePart[];
  providerOptions?: Record<string, any>;
  createdAt?: Date;
  metadata?: M;
}

// 聊天状态类型 - 支持泛型消息扩展
export interface ChatState<M = MessageMetadata> {
  messages: ChatMessage<M>[];
  isLoading: boolean;
  error?: Error;
  sendMessage: (options: { text: string; }) => void;
  [key: string]: any;
}
