import { Router, Request, Response } from 'express';
import { localIndustryModel, IndustryResearchModel } from '../methods/industry-research';
import { queryMongoDocsWithTotal, putMongoDoc } from '../models/mongo-utils';
import _ from 'lodash';

const router = Router();

// 通用查询函数 - 只关注业务逻辑，不依赖 Express 对象
const handleQuery = async (queryParams: any) => {
  const params = { ...queryParams };
  let { total, count, data } = await queryMongoDocsWithTotal(localIndustryModel as any, params);
  data = _.omit(data, 'data.content', 'data.json', 'data.reasoningText')
  return { total, count, data };
};

// 获取行业研究列表，支持分页、排序和筛选（使用查询字符串）
router.get('/researches', async (req: Request, res: Response) => {
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
router.put('/researches/:id?', async (req: Request, res: Response) => {
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
    const data = await putMongoDoc(localIndustryModel, body, { _id: id });
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
