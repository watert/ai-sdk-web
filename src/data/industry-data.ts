import _industryData from './industry-tag-info-36.json';

/**
 * 行业标签信息接口定义
 */
interface IndustryTagInfo {
  id: string; // 行业唯一标识符
  name: string; // 行业中文名称
  name_en: string; // 行业英文名称
  desc: string; // 行业描述
  tags: string[]; // 相关标签列表
  audienceDesc: string; // 受众描述
  audienceTags: string[]; // 受众标签列表
  audienceMbtis: string[]; // 受众MBTI类型列表
  audienceFemaleRate: number; // 女性受众比例 (0-100)
}

/**
 * 行业标签信息数组，包含36个行业的详细数据
 */
export const industryData: IndustryTagInfo[] = _industryData;