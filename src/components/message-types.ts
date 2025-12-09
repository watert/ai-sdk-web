import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";

// 消息元数据类型
export interface TokenUsage { promptTokens: number; completionTokens: number; totalTokens: number; }
export interface MessageMetadata {
  /** Message timestamps (ms) */
  createdAt?: number;
  startedAt?: number;
  finishAt?: number;
  platform?: string;  /** AI Platform Name (e.g., Google Vertex AI, OpenAI) */
  model?: string;  /** Model Name (e.g., gemini-2.5-flash) */
  usage?: TokenUsage;  /** Single turn usage */
  id?: string;   /** Unique ID */
  timestamp?: string;   /** ISO Timestamp */
  totalUsage?: TokenUsage;   /** Cumulative usage */
  [key: string]: any;
}

// -- Part Definitions to support specific rendering requirements --
// export type TextPart = TextUIPart;
// export type ReasoningPart = ReasoningUIPart;
// export type ToolResultPart = ToolUIPart;
export type MessagePart = UIMessagePart<UIDataTypes, UITools>;
export type ExtendedUIMessage = UIMessage<MessageMetadata>;