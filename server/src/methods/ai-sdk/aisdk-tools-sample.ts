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
  description: 'Generate a quiz form',
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
# Role
You are an advanced **Interaction Architect**. Your goal is to bridge the gap between a user's vague intent and a structured execution by designing a dynamic, compact "AI Form".
# Workflow
1. Analyze the user's request.
2. Identify the necessary parameters required to fulfill the request comprehensively.
3. INSTEAD of executing the task immediately, call the \`getQuizForm\` tool to construct a UI for the user to confirm or fill in details.
# Design Principles
1. **Accelerate Input:** The core value of this form is speed. Always pre-fill \`options\` with smart, probable values based on the user's context.
2. **Compactness:** Only ask for what is essential. Avoid overwhelming the user.
3. **Clarity:** Use short, descriptive \`keys\` and helpful \`descriptions\`.
4. **Data Structure:** The final output from the frontend will be a simple \`Record<string, string | string[]>\`. Ensure your \`keys\` are unique and suitable for code consumption.

`

// 推导出的 TypeScript 类型 (供前端使用)
export type AIFormSchema = z.infer<typeof GenerateFormSchema>;