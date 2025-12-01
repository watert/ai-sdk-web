import { ModelMessage } from "ai";
import mongoose from "mongoose";
import { RepeatRule, CalendarEvent } from "../libs/CalendarEvent";
import { getErrorInfo } from "../libs/getErrorInfo";
import { LocalMongoModel } from "../models/local-mongo-model";
import { aiGenTextStream, AiGenTextStreamResult } from "./ai-sdk/ai-gen-text";
import { handleCalendarTask } from "./calendar-task";
import _industryData from '../../data/industry-data.json';
function getIndustryInfo(industryId: string) {
  return _industryData.find(item => item.id === industryId);
}


const IndustryResearchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  prompt: { type: String, required: true },
}, { timestamps: true, strict: false });
export const IndustryResearchModel = mongoose.model('industry_research', IndustryResearchSchema);

/** 目前这个 prompt 经测试在有 websearch 开启下的 qwen-plus / gemini-flash-latest 下运转良好 */
export const sysPrompt = `
你是资深的行业调研、搜索与社媒运营专家。你擅长调研处理不同的行业的需求情况，并能够以专家和行业受众用户的不同视角进行 Web 搜索以根据指令获取不同的数据，并推荐给社交媒体一些用于创作的灵感 Prompt。
type Inspiration = {
  title: string, // 标题, 20 字左右
  date?: string, // 可能有的明确日期(比如新闻), 格式为 YYYY-MM-DD
  content: string, // 内容主体, 200 字左右
  tags: string[], // 标签, 3~5 个
  postIdeas: string[], // 3 条相关联的社媒灵感 Prompt, 可用于 LLM 进行文章生成。注意，是用于给 LLM 的指令而非标题；每个 idea 长度为 20 字左右；直接描述题材、题目或问题，不要带有"生成"、"撰写"这类的动作描述；
}
type ReturnData = {
  inspirations: Inspiration[],
  summary: string, // 汇总总结, 50 字左右
}
你生成出来的数据为符合 Inspiration[] 的 JSON 格式。注意，仅返回 JSON 数据，不要包含任何其他文本。
`.trim();

export const getIndustryResearchMsgs = ({ industry, prompt }: {
  industry: string,
  prompt: string,
}): ModelMessage[] => {
  return [
    { role: 'system', content: sysPrompt },
    { role: 'user', content: `行业: **${industry}**\n指令:${prompt}。\n\n按照 ReturnData 格式返回 JSON 格式` },
  ];
};



export type IndustryResearchConfig = {
  id: string, title: string, prompt: string,
  repeatRule: RepeatRule,
  startDateTime?: Date | string,
};
const DEFAULT_START_DATE = '2025-01-01T08:00+08:00'
export const baseIndustryResearchList: IndustryResearchConfig[] = [
  { id: 'MONTHLY_TRENDS', title: '行业趋势', prompt: '过去一个月的 4~7 条主要行业趋势', repeatRule: { frequency: 'MONTHLY' } },
  { id: 'DAILY_NEWS', title: '新闻动态', prompt: '昨天的重点新闻动态', repeatRule: { frequency: 'DAILY' } },
  { id: 'WEEKLY_NEWS', title: '新闻动态', prompt: '过去一周的重点新闻动态', repeatRule: { frequency: 'WEEKLY' } },
  { id: 'HOT_TOPICS', title: '热门话题', prompt: '过去一周的热门话题', repeatRule: { frequency: 'WEEKLY' } },
];

async function arrayFromAsync(asyncIterator: AsyncIterable<any>) {
  const arr: any[] = [];
  for await (const item of asyncIterator) { arr.push(item); }
  return arr;
}
export function handleIndustryResearchTask({ platform, model, industryId, config, local, dbModel }: {
  config: IndustryResearchConfig | string,
  dbModel?: mongoose.Model<any>,
  industryId: string,
  local?: boolean;
  platform?: string,
  model?: string,
}): AiGenTextStreamResult & {
  taskResult: Promise<any>,
} {
  if (!dbModel && local) {
    dbModel = new LocalMongoModel('test_industry_research') as any;
  }
  if (!dbModel) dbModel = IndustryResearchModel;
  if (typeof config === 'string') {
    config = baseIndustryResearchList.find(item => item.id === config) as IndustryResearchConfig;
  }
  const { id, title, prompt, startDateTime = DEFAULT_START_DATE, repeatRule } = config;
  const calendarId = `${industryId}--${id}`;
  const calendar = new CalendarEvent({
    id: calendarId, title, description: prompt, startDateTime, repeatRule,
  });
  const industry = getIndustryInfo(industryId)
  if (!industry) throw new Error(`industry ${industryId} not found`);
  // aiGenTextStream()
  const messages = getIndustryResearchMsgs({ industry: industry.name || industry.name_en, prompt });
  // const genResult = aiGenTextStream({ platform: 'GEMINI', model: 'gemini-2.5-flash-lite', messages, search: true })
  const genResult = aiGenTextStream({
    platform: platform || 'GEMINI', model: model || 'gemini-flash-latest',
    search: true, messages,
  })
  const task = async (info: { date: Date, id: string }) => {
    let msgs: any[] = [], error;
    const [content, reasoningText, totalUsage] = await Promise.all([
      genResult.content,
      genResult.reasoningText,
      genResult.totalUsage,
    ]).catch(async err => {
      error = getErrorInfo(err);
      msgs = await arrayFromAsync(genResult.toUIMessageStream());
      return [];
    });
    // const reasoningText = await genResult.content.catch
    return { ...info, ...genResult.info, content, reasoningText, totalUsage, error, msgs, industryId, msg: `Executed: ${(new Date()).toISOString()}` };
  };
  const taskResult = handleCalendarTask({ calendar, task, model: dbModel as any, force: true });
  return {
    ...genResult,
    taskResult,
  };
}