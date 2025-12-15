import { appAxios } from './appAxios';
import { CalendarEvent } from '../libs/CalendarEvent';
import type { EventDetails, RepeatRule as CalendarRepeatRule, Weekday, RepeatRule } from '../libs/CalendarEvent';

export type IndustryResearchConfig = {
  id: string, title: string, prompt: string, type?: string,
  repeatRule: RepeatRule, startDateTime?: Date | string,
};


// 定义行业研究组数据结构，用于IndustryResearchGroup组件
export type IndustryResearchGroupData = {
  title: string;
  summary: string;
  inspirations: Array<{
    title: string;
    date: string;
    content: string;
    tags: string[];
    postIdeas: string[];
  }>;
};

export type IndustryResearchDoc = {
  _id?: string; calendarId: string; taskTime?: string; updatedAt?: string; rule: RepeatRule; error?: string | null;
  data: Partial<{
    date: string; id: string; platform: string; model: string; config: IndustryResearchConfig;
    industryId: string; msg: string; content?: string; json?: IndustryResearchGroupData; reasoningText?: string;
    totalUsage?: { inputTokens: number; outputTokens: number; totalTokens: number; reasoningTokens: number; };
  }>;
};


/**
 * 从 IndustryResearchDoc 构建 CalendarEvent 实例
 * @param doc 行业研究文档
 * @returns 对应的 CalendarEvent 实例
 */
export function getCalendarFromResearchGroup(doc: IndustryResearchDoc): CalendarEvent {
  console.log('get calen', doc);
  // 构建 EventDetails
  const eventDetails: EventDetails = {
    id: doc.calendarId,
    title: doc.data.config?.title || 'Untitled',
    // description: doc.data.msg || doc.data.content || doc.data.json?.summary || undefined,
    startDateTime: doc.updatedAt as any, // 假设是 ISO 字符串
    // startDateTime: doc.taskTime, // 假设是 ISO 字符串
    // endDateTime: undefined, // 没有明确的结束时间
    // hasEndTime: false,
    repeatRule: doc.rule,
    lastTriggeredTime: doc.updatedAt || doc.taskTime,
    // triggeredCount: 0,
  };
  
  return new CalendarEvent(eventDetails);
}

/**
 * 将 industry-research 中的 RepeatRule 转换为 CalendarEvent 兼容的 RepeatRule
 */
// function convertRepeatRule(rule: RepeatRule): CalendarRepeatRule | null {
//   if (!rule) return null;
  
//   // 转换 frequency
//   const frequency = rule.frequency.toUpperCase();
//   let validFrequency: 'MONTHLY' | 'WEEKLY' | 'DAILY' = 'DAILY';
//   if (frequency === 'MONTHLY' || frequency === 'WEEKLY' || frequency === 'DAILY') {
//     validFrequency = frequency;
//   } else {
//     console.warn(`Unsupported frequency: ${rule.frequency}, defaulting to DAILY`);
//   }
  
//   // 转换 end
//   let end: CalendarRepeatRule['end'];
//   if (rule.count !== undefined) {
//     end = { type: 'COUNT', value: rule.count };
//   } else if (rule.until !== undefined) {
//     end = { type: 'UNTIL_DATE', value: rule.until };
//   }
  
//   return {
//     frequency: validFrequency,
//     interval: rule.interval,
//     byWeekDays: rule.byDay as Weekday[], // 假设格式匹配
//     byMonthDays: rule.byMonthDay,
//     end,
//   };
// }
