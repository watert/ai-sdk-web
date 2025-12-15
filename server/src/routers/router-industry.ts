import { Router, Request, Response } from 'express';
import { localIndustryModel, IndustryResearchModel, IndustryResearchConfig } from '../methods/industry-research';
import { queryMongoDocsWithTotal, putMongoDoc } from '../models/mongo-utils';
import _ from 'lodash';
import { RepeatRule } from '../libs/CalendarEvent';
import { USE_LOCAL_MONGO } from '../config';

const industryModel = USE_LOCAL_MONGO ? localIndustryModel : IndustryResearchModel;


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

// 定义行业研究文档类型
export type IndustryResearchDoc = {
  _id: string; calendarId: string; taskTime: string; updatedAt: string;
  rule: RepeatRule; error: string | null;
  data: {
    json: IndustryResearchGroupData; config: IndustryResearchConfig;
    date: string; id: string; platform: string; model: string;
    industryId: string; msg: string;
    content?: string; reasoningText?: string; totalUsage?: any;
  };
};

// 定义查询参数类型
export type IndustryResearchQueryParams = {
  [key: string]: any;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
};

// 定义查询结果类型
export type IndustryResearchQueryResult = {
  total: number;
  count: number;
  data: IndustryResearchDoc[];
};

const router = Router();

// 通用查询函数 - 只关注业务逻辑，不依赖 Express 对象
const handleQuery = async (queryParams: IndustryResearchQueryParams): Promise<IndustryResearchQueryResult> => {
  const params = { $sort: '-updatedAt', ...queryParams };
  let { total, count, data } = await queryMongoDocsWithTotal(
    industryModel as any, params,
  );
  // 移除不需要返回的敏感字段
  const processedData = data.map(doc => {
    return _.omit(doc, ['data.content', 'data.reasoningText']) as IndustryResearchDoc;
  }).filter(r => !!r.data.json);
  return { total, count, data: processedData };
};

// 获取行业研究列表，支持分页、排序和筛选（使用查询字符串）
router.get('/researches/', async (req: Request, res: Response) => {
  try {
    const result = await handleQuery(req.query as any);
    res.json({
      success: true, ...result,
      message: '查询行业研究成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询行业研究失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 获取行业研究列表，支持复杂查询条件（使用请求体）
router.post('/researches/query', async (req: Request, res: Response) => {
  try {
    const result = await handleQuery(req.body);
    res.json({
      success: true, ...result,
      message: '查询行业研究成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询行业研究失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 获取单个行业研究详情
router.get('/researches/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await localIndustryModel.findOne({ id });
    if (!data) {
      return res.status(404).json({
        success: false,
        message: '行业研究不存在'
      });
    }
    res.json({
      success: true,
      data,
      message: '获取行业研究详情成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取行业研究详情失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 创建或更新行业研究
router.put('/researches/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await putMongoDoc(localIndustryModel, body, { _id: id });
    res.json({
      success: true,
      data,
      message: id ? '更新行业研究成功' : '创建行业研究成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '保存行业研究失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 创建行业研究（使用 POST 方法）
router.post('/researches', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const data = await putMongoDoc(localIndustryModel, body, {});
    res.status(201).json({
      success: true,
      data,
      message: '创建行业研究成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建行业研究失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 更新行业研究（使用 PATCH 方法）
router.patch('/researches/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await putMongoDoc(industryModel, body, { _id: id });
    res.json({
      success: true,
      data,
      message: '更新行业研究成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新行业研究失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 删除行业研究
router.delete('/researches/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await localIndustryModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: '行业研究不存在'
      });
    }
    res.json({
      success: true,
      message: '删除行业研究成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除行业研究失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
