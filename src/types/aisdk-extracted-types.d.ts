export interface AISDKUIMessage<
  METADATA = unknown,
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS extends UITools = UITools,
> {
  id: string; role: 'system' | 'user' | 'assistant';
  parts: Array<AISDKUIMessagePart<DATA_PARTS, TOOLS>>; /** 消息的组成部分，用于 UI 渲染 */
  metadata?: METADATA;
}
export type AISDKUIMessagePart<
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS extends UITools = UITools,
> =
  | AISDKTextUIPart | AISDKReasoningUIPart | AISDKToolUIPart<TOOLS>
  | AISDKSourceUrlUIPart | AISDKSourceDocumentUIPart | AISDKFileUIPart
  | AISDKDataUIPart<DATA_PARTS> | AISDKStepStartUIPart;

/** 文本部分 */
export type AISDKTextUIPart = { type: 'text'; text: string; state?: 'streaming' | 'done'; };

/** 推理过程部分 */
export type AISDKReasoningUIPart = {
  type: 'reasoning'; text: string; state?: 'streaming' | 'done';
  providerMetadata?: Record<string, any>;
};

/** 工具调用部分 (基于工具名称生成的映射类型) */
type UITool = { input: unknown; output: unknown | undefined; };
type UITools = Record<string, UITool>;
export type AISDKToolUIPart<TOOLS extends UITools = UITools> = ValueOf<{
  [NAME in keyof TOOLS & string]: {
    type: `tool-${NAME}`;
    toolCallId: string;
  } & (
    | { state: 'input-streaming'; input: Partial<TOOLS[NAME]['input']> | undefined; providerExecuted?: boolean; output?: never; errorText?: never; }
    | { state: 'input-available'; input: TOOLS[NAME]['input']; providerExecuted?: boolean; output?: never; errorText?: never; }
    | { state: 'output-available'; input: TOOLS[NAME]['input']; output: TOOLS[NAME]['output']; errorText?: never; providerExecuted?: boolean; }
    | { state: 'output-error'; input: TOOLS[NAME]['input']; output?: never; errorText: string; providerExecuted?: boolean; }
  );
}>;

/** 来源 URL 部分 */
export type AISDKSourceUrlUIPart = {
  type: 'source-url';
  sourceId: string;
  url: string;
  title?: string;
  providerMetadata?: Record<string, any>;
};

/** 文档来源部分 */
export type AISDKSourceDocumentUIPart = {
  type: 'source-document'; sourceId: string; mediaType: string;
  title: string; filename?: string;
  providerMetadata?: Record<string, any>;
};

/** 文件上传/展示部分 */
export type AISDKFileUIPart = {
  type: 'file'; mediaType: string;
  filename?: string; url: string; // 托管 URL 或 Data URL
};

/** 自定义数据部分 (基于名称的映射类型) */
type UIDataTypes = Record<string, unknown>;
export type AISDKDataUIPart<DATA_TYPES extends UIDataTypes> = ValueOf<{
  [NAME in keyof DATA_TYPES & string]: {
    type: `data-${NAME}`; id?: string; data: DATA_TYPES[NAME];
  };
}>;

/** 步骤开始标识 */
export type AISDKStepStartUIPart = { type: 'step-start'; };

type ValueOf<ObjectType, ValueType extends keyof ObjectType = keyof ObjectType> = ObjectType[ValueType];
