import type { ToolUIPart } from "ai";

// 消息元数据类型
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface MessageMetadata {
  /** Message timestamps (ms) */
  createdAt?: number;
  startedAt?: number;
  finishAt?: number;
  /** AI Platform Name (e.g., Google Vertex AI, OpenAI) */
  platform?: string;
  /** Model Name (e.g., gemini-2.5-flash) */
  model?: string;
  /** Single turn usage */
  usage?: TokenUsage;
  /** Unique ID */
  id?: string;
  /** ISO Timestamp */
  timestamp?: string;
  /** Cumulative usage */
  totalUsage?: TokenUsage;
  [key: string]: any;
}

// -- Part Definitions to support specific rendering requirements --

export interface TextPart {
  type: 'text';
  text: string;
}

export interface ReasoningPart {
  type: 'reasoning';
  text: string; // The thought process
  state?: 'streaming' | 'done';
  // signature?: string; // Optional signature or thinking time
  // isCollapsed?: boolean; // Default UI state
}

export interface ImagePart {
  type: 'image';
  uri: string;
  mimeType?: string;
  alt?: string;
}

export interface FilePart {
  type: 'file';
  uri: string;
  mimeType: string;
  name: string;
  size?: string;
}

export interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
}

export type ToolResultPart = ToolUIPart;
// export interface ToolResultPart {
//   type: `tool-${string}`;
//   toolCallId: string;
//   state: string;
//   result: any;
//   isError?: boolean;
// }

// Union type for all possible parts
export type MessagePart = 
  | TextPart 
  | ReasoningPart 
  | ImagePart 
  | FilePart 
  | ToolCallPart 
  | ToolResultPart;

/**
 * UIMessage definition from ai-sdk-core adapted for our extended needs.
 * We include a `parts` array to explicitly handle the complex types requested
 * (reasoning, tool calls, etc.) which might be flattened to string in standard `content`.
 */
export interface UIMessage<Meta = Record<string, unknown>> {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string; // String representation (fallback)
  metadata?: Meta; // Metadata
  
  // Custom extension for this specific UI requirement to support rich parts
  // In a real generic UIMessage, this might be parsed from content or toolInvocations
  parts?: MessagePart[]; 
}

export type ExtendedUIMessage = UIMessage<MessageMetadata>;