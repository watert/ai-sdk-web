import { ModelMessage } from "ai";
import mongoose from "mongoose";
import { RepeatRule, CalendarEvent, EventDetails } from "../libs/CalendarEvent";
import { getErrorInfo } from "../libs/getErrorInfo";
import { LocalMongoModel } from "../models/local-mongo-model";
import { aiGenTextStream, AiGenTextStreamResult } from "./ai-sdk/ai-gen-text";
import { calendarTaskResult, handleCalendarTask } from "./calendar-task";
import _industryData from '../../data/industry-data.json';
import _ from "lodash";
import { makeAsyncIterable } from "../libs/makeAsyncIterable";
import { z } from "zod";

// import _industryResearchSample from './industry-research-sample.local.json';
function getIndustryInfo(industryId: string): {
  id: string, name?: string, name_zh: string, name_en: string, prompt: string,
} | undefined {
  return _industryData.find(item => item.id === industryId) as any;
}

const IndustryResearchSchema = new mongoose.Schema({
  // id: { type: String, required: true, unique: true },
  taskTime: Date,
  data: {
    json: Object,
    locales: Object,
    i18nUsage: Object,
    config: Object,
  },
  calendarId: { type: String, required: true },
  triggeredAt: Date,
  rule: { frequency: { type: String }, }
}, { timestamps: true, strict: false });
export const IndustryResearchModel = mongoose.model('industry_research', IndustryResearchSchema);

/** 目前这个 prompt 经测试在有 websearch 开启下的 qwen-plus / gemini-flash-latest 下运转良好 */
export const sysPrompt = `
你是资深的行业调研、搜索与社媒运营专家。
你擅长调研处理不同的行业的需求情况，并能够以专家和行业受众用户的不同视角进行 Web 搜索以根据指令获取不同的数据，并推荐给社交媒体一些用于创作的灵感 Prompt。
type Inspiration = {
  title: string, // 标题, 20 字左右
  date?: string, // 可能有的明确日期(比如新闻)或其实日期, 格式为 YYYY-MM-DD
  dateEnd?: string, // 可能有的明确的终止日期, 格式为 YYYY-MM-DD
  content: string, // 内容主体, 200 字左右, 格式为 markdown 仅纯文本与加粗标记重点
  tags: string[], // 标签, 3~5 个
  postIdeas: string[], // 3 条相关联的社媒灵感 Prompt, 可用于 LLM 进行文章生成。注意，是用于给 LLM 的指令而非标题；每个 idea 长度为 15 字左右；直接描述题材、题目或问题，以最简短的方式提供关键线索，不要带有"生成"、"撰写"这类的动作描述；
}
type ReturnData = {
  inspirations: Inspiration[],
  summary: string, // 汇总总结, 50 字左右
  title: string, // 精炼的吸引眼球的标题, 20 字左右
}
* 你生成出来的数据为符合 Inspiration[] 的 JSON 格式。注意，仅输出 JSON 数据，不要包含任何其他文本；
* 主要聚焦于欧美资讯，包括但而限于新闻、博客、社交媒体动态等；
`.trim();

// Zod schema based on ReturnData type in sysPrompt
export const researchDocSchema = z.object({
  inspirations: z.array(z.object({
    title: z.string().describe("标题, 20 字左右"),
    date: z.string().optional().describe("可能有的明确日期(比如新闻)或其实日期, 格式为 YYYY-MM-DD"),
    dateEnd: z.string().optional().describe("可能有的明确的终止日期, 格式为 YYYY-MM-DD"),
    content: z.string().describe("内容主体, 200 字左右, 格式为 markdown 仅纯文本与加粗标记重点"),
    tags: z.array(z.string()).min(2).max(8).describe("标签, 3~5 个"),
    postIdeas: z.array(z.string()).min(2).max(6).describe("3 条相关联的社媒灵感 Prompt")
  })).min(1),
  summary: z.string().describe("汇总总结, 50 字左右"),
  title: z.string().describe("精炼的吸引眼球的标题, 20 字左右"),
  locales: z.object().optional(),
});

// Type inferred from the schema
export type ResearchDoc = z.infer<typeof researchDocSchema>;

export const getIndustryResearchMsgs = ({ industry, prompt }: {
  industry: string,
  prompt: string,
}): ModelMessage[] => {
  return [
    { role: 'system', content: sysPrompt },
    { role: 'user', content: `行业: **${industry}**\n指令:${prompt}。\n\n按照 ReturnData 格式输出 JSON 格式` },
  ];
};

export type IndustryResearchConfig = {
  id: string, title: string, prompt: string, type?: string,
  repeatRule: RepeatRule,
  startDateTime?: Date | string,
};
const DEFAULT_START_DATE = '2025-01-01T08:00+08:00'
export const baseIndustryResearchList: IndustryResearchConfig[] = [
  { id: 'DAILY_NEWS', title: '新闻动态', prompt: '昨天的 4 条重点新闻动态', repeatRule: { frequency: 'DAILY' } },
  { id: 'WEEKLY_NEWS', title: '新闻动态', prompt: '过去一周的 6 条重点新闻动态', repeatRule: { frequency: 'WEEKLY' } },
  { id: 'HOT_TOPICS', title: '热门话题', prompt: '过去一周的 6 条热门话题', repeatRule: { frequency: 'WEEKLY' } },
  { id: 'MONTHLY_TRENDS', title: '行业趋势', prompt: '过去一个月的 4~8 条主要行业趋势', type: 'trend', repeatRule: { frequency: 'MONTHLY' } },
];

async function arrayFromAsync(asyncIterator: AsyncIterable<any>) {
  const arr: any[] = [];
  for await (const item of asyncIterator) { arr.push(item); }
  return arr;
}
export const localIndustryModel = new LocalMongoModel('test_industry_research');
export async function handleIndustryResearchTask({
  force, platform, model, thinking = true, industryId, config, local, dbModel,
  jsonData,
  // jsonData = _industryResearchSample,
}: {
  config: IndustryResearchConfig | string,
  dbModel?: mongoose.Model<any>,
  industryId: string,
  local?: boolean,
  force?: boolean,
  platform?: string,
  model?: string,
  thinking?: boolean,
  jsonData?: any;
}): Promise<AiGenTextStreamResult & {
  taskResult: Promise<calendarTaskResult<any>>,
}> {
  if (!dbModel && local) {
    dbModel = localIndustryModel as any;
  }
  if (!dbModel) {
    dbModel = IndustryResearchModel;
  }
  if (typeof config === 'string') {
    config = baseIndustryResearchList.find(item => item.id === config) as IndustryResearchConfig;
  }
  const { id, title, prompt, startDateTime = DEFAULT_START_DATE, repeatRule } = config;
  const calendarId = `${industryId}--${id}`;
  const lastDoc: any = await dbModel.findOne({ calendarId }).sort({ triggeredAt: -1 }).lean();
  const isLastDocValid = researchDocSchema.safeParse(lastDoc?.data?.json);
  console.log('isLastDocValid', isLastDocValid);
  const lastTriggeredAt = lastDoc?.triggeredAt || lastDoc?.updatedAt;

  const calendarParams: EventDetails = { id: calendarId, title, description: prompt, startDateTime, repeatRule, lastTriggeredTime: lastTriggeredAt };
  // console.log('calendarParams', calendarParams);
  const calendar = new CalendarEvent(calendarParams);
  const industry = getIndustryInfo(industryId)
  if (!industry) throw new Error(`industry ${industryId} not found`);
  const messages = getIndustryResearchMsgs({
    industry: (industry as any).name || industry.name_zh || industry.name_en,
    prompt,
  });
  if (!force && isLastDocValid.success && !calendar.shouldTrigger()) {
    const taskInfo = { status: 'skip', message: 'not trigger' };
    return { taskResult: Promise.resolve({ taskInfo })} as any;
  }
  let genResult = jsonData ? jsonData as any: aiGenTextStream({
    platform: platform || 'GEMINI', model: model || 'gemini-flash-latest',
    search: true, thinking, messages, context: { industryId, calendarId },
  });
  const task = async (info: { taskTime: Date, calendarId: string }) => {
    if (jsonData) return jsonData;
    let msgs: any[] = [], error;
    const [content, json, reasoningText, totalUsage] = await Promise.all([
      genResult.content,
      genResult.toJsonFormat(),
      genResult.reasoningText,
      genResult.totalUsage,
    ]).catch(async err => {
      error = getErrorInfo(err);
      // msgs = await arrayFromAsync(genResult.toUIMessageStream());
      return [];
    });
    // console.log('gen-result', await genResult.toPromise());
    const ret = { ...info, ...genResult.info, config: _.omit(config, 'repeatRule'),
      json, content, reasoningText,
      totalUsage, error, msgs, industryId,
      msg: `Executed: ${(new Date()).toISOString()}`,
    };
    console.log('ret::', JSON.stringify(ret));
    return ret;
  };
  const taskResult = handleCalendarTask({ calendar, task, model: dbModel as any, force: true });
  return { ...genResult, taskResult };
}

export async function getLatestResearchDocs({
  $match = {}, dbModel = IndustryResearchModel
}: {
  $match?: Record<string, any>, dbModel?: mongoose.Model<any>
}) {
  return await dbModel.aggregate([
    $match && { $match },
    { $group: { _id: "$calendarId",
      latestDoc: { $top: { sortBy: { taskTime: -1 }, output: "$$ROOT" } }
    }},
    { $replaceRoot: { newRoot: "$latestDoc" } },
  ].filter(r => r));
}
