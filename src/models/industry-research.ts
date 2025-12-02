import { appAxios } from './appAxios';

// 从服务器端同步的类型定义
export type RepeatRule = {
  frequency: string;
  interval?: number;
  byDay?: string[];
  byMonthDay?: number[];
  count?: number;
  until?: string;
};

export type IndustryResearchConfig = {
  id: string;
  title: string;
  prompt: string;
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
  _id: string;
  calendarId: string;
  taskTime: string;
  updatedAt: string;
  rule: RepeatRule;
  error: string | null;
  data: {
    date: string;
    id: string;
    platform: string;
    model: string;
    config: IndustryResearchConfig;
    industryId: string;
    msg: string;
    content?: string;
    json?: IndustryResearchGroupData;
    reasoningText?: string;
    totalUsage?: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      reasoningTokens: number;
    };
  };
};

export type IndustryResearchQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  'data.industryId'?: string;
  [key: string]: any;
};

export type IndustryResearchListResponse = {
  total: number;
  count: number;
  data: IndustryResearchDoc[];
};

/**
 * 获取行业研究列表
 * @param params 查询参数
 * @returns 行业研究列表数据
 */
export const getIndustryResearches = async (
  params: IndustryResearchQueryParams
): Promise<IndustryResearchListResponse> => {
  const response = await appAxios.get<IndustryResearchListResponse>(
    '/industry/researches',
    { params }
  );
  return response.data;
};
