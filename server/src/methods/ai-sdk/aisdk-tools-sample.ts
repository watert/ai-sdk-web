import { tool } from "ai";
import { z } from 'zod';
import _ from "lodash";

export const getWeather = tool({
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get weather for'),
    unit: z.enum(['celsius', 'fahrenheit']).describe('Temperature unit')
  }),
  async *execute({ location }, opts) {
    yield { status: 'loading' as const, text: 'fetch weather started' }; // output will be changed later
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield { location, temperature: 25, description: 'Sunny' }
  }
});


// 基础字段属性
const BaseFieldSchema = z.object({
  key: z.string().describe("字段的唯一标识符，用于输出数据的 key"),
  label: z.string().describe("字段显示的简短标题 (Label)"),
  description: z.string().optional().describe("字段的补充说明或提示 (Tooltip/Placeholder)"),
  required: z.boolean().default(true).describe("是否必填"),
});

// 1. Text 组件
const TextFieldSchema = BaseFieldSchema.extend({
  type: z.literal('text'),
  options: z.array(z.string()).min(1).describe("AI 生成的推荐值列表，必填，用于加速输入"),
  defaultValue: z.string().optional(),
});

// 2. Select 组件
const SelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(z.string()).min(1).describe("下拉选项列表"),
  creatable: z.boolean().optional().describe("是否允许用户输入选项之外的值"),
  defaultValue: z.string().optional(),
});

// 3. Tags 组件
const TagsFieldSchema = BaseFieldSchema.extend({
  type: z.literal('tags'),
  options: z.array(z.string()).min(1).describe("推荐的标签列表"),
  creatable: z.boolean().optional().describe("是否允许用户创建新标签"),
  defaultValue: z.array(z.string()).optional(),
});

// 联合类型
const FormFieldSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  SelectFieldSchema,
  TagsFieldSchema,
]);

// 最终 Tool 的参数 Schema
export const GenerateFormSchema = z.object({
  title: z.string().describe("表单的标题，概括本次任务"),
  fields: z.array(FormFieldSchema).describe("表单字段列表"),
  submitLabel: z.string().optional().describe("提交按钮的文案，如 'Generate', 'Search', 'Run'"),
});

export const getQuizForm = tool({
  description: '生成动态紧凑的AI表单，弥合用户意图与结构化执行之间的差距。分析请求，识别必要参数，构建UI界面供用户确认或填写详情。遵循以下原则：使用预填充选项加速输入，保持表单紧凑（约3个字段），使用描述性键确保清晰，输出Record<string, string | string[]>数据结构，并保持与用户输入的语言一致性。',
  inputSchema: GenerateFormSchema,
  async *execute(params, opts) {
    const { title, fields, submitLabel } = params;
    console.log('params', JSON.stringify(params));
    throw new Error('TODO: implement getQuizForm');
    yield { status: 'loading' as const, text: 'generate quiz form started' }; // output will be changed later
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield { title, fields, submitLabel }
  }
});

export const quizFormSysPrompt = `
# 角色
你是一位高级**交互架构师**。你的目标是通过设计一个动态、紧凑的"AI表单"来弥合用户模糊意图与结构化执行之间的差距。
# 工作流程
1. 分析用户的请求。
2. 全面识别完成请求所需的必要参数。
3. 不要立即执行任务，而是调用\`getQuizForm\`工具构建一个UI界面，让用户确认或填写详细信息。
# 设计原则
1. **加速输入**：此表单的核心价值是速度。始终根据用户上下文预填充\`options\`，提供智能、可能的选项值。
2. **紧凑性**：只询问必要的信息。避免让用户感到不知所措。生成的表单字段数量默认控制在3个左右。
3. **清晰度**：使用简短、描述性的\`keys\`和有帮助的\`descriptions\`。
4. **数据结构**：前端的最终输出将是一个简单的\`Record<string, string | string[]>\`。确保你的\`keys\`是唯一的，并且适合代码使用。
5. **语言一致性**：生成的表单内容（包括标题、标签、描述等）必须与用户输入的指令语言保持一致。

`

// 推导出的 TypeScript 类型 (供前端使用)
export type AIFormSchema = z.infer<typeof GenerateFormSchema>;