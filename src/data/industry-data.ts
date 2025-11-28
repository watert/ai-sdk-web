import _industryData from './industry-tag-info-36.json';
import type { EventDetails, RepeatRule } from '../libs/CalendarEvent';

export type IndustryResearchConfig = {
  id: string, title: string, prompt: string,
  repeatRule: RepeatRule,
  startDateTime?: Date | string,
};

export type IndustryEventType = {
    eventDetails?: Omit<EventDetails, 'repeatRule'|'title'|'id'>;
    repeatRule?: RepeatRule;
}
/**
 * 行业标签信息接口定义
 */
export interface IndustryTagInfo {
  id: string; // 行业唯一标识符
  name: string; // 行业中文名称
  name_en: string; // 行业英文名称
  desc: string; // 行业描述
  emoji: string; // 行业对应的emoji
  priority?: number; // 行业排序优先级
  tags: string[]; // 相关标签列表
  audienceDesc: string; // 受众描述
  audienceTags: string[]; // 受众标签列表
  audienceMbtis: string[]; // 受众MBTI类型列表
  audienceFemaleRate: number; // 女性受众比例 (0-100)
  researchSchedules?: IndustryResearchConfig[];
  enableResearch?: boolean;
}

export const baseIndustryResearchList: IndustryResearchConfig[] = [
    { id: 'MONTHLY_TRENDS', title: '行业趋势', prompt: '过去一个月的 4~7 条主要行业趋势', 
        repeatRule: { frequency: 'MONTHLY' }
    },
    { id: 'DAILY_NEWS', title: '新闻动态', prompt: '昨天的重点新闻动态', 
        repeatRule: { frequency: 'DAILY' }
    },
    { id: 'WEEKLY_NEWS', title: '新闻动态', prompt: '过去一周的重点新闻动态', 
        repeatRule: { frequency: 'WEEKLY' }
    },
    { id: 'HOT_TOPICS', title: '热门话题', prompt: '过去一周的热门话题', 
        repeatRule: { frequency: 'WEEKLY' }
    },
];

const industryConfigs: Record<string, {
    enableResearch?: boolean;
    researchSchedules: IndustryResearchConfig[];
}> = {
    "finance": {
        enableResearch: true,
        researchSchedules: baseIndustryResearchList,
    },
    "ai": {
        enableResearch: true,
        researchSchedules: baseIndustryResearchList,
    },
};
/**
 * 行业标签信息数组，包含36个行业的详细数据
 */
export const industryData: IndustryTagInfo[] = _industryData.map(industry => {
    const { researchSchedules, enableResearch } = industryConfigs[industry.id] || {};
    return {
        ...industry,
        enableResearch: enableResearch ?? false,
        researchSchedules: researchSchedules || [],
    }
});
// export const industryById = keyBy(industryData, 'id');