import { connectMongo } from "../models/mongo-index";
import { researchDocSchema } from "./industry-research";
import { translateLatestResearchDocs, translateResearchDoc } from "./industry-research-i18n";

describe('industry-research-i18n', () => {
  connectMongo();
  it.skip('should translate a research doc', async () => {
    const doc =  { "inspirations": [ { "title": "AI股票估值受考验，科技股承压回调", "date": "2025-12-14", "content": "在Oracle和Broadcom发布令人失望的报告后，市场对人工智能（AI）板块的估值担忧再次浮现，导致纳斯达克100指数在上周五显著下跌。", "tags": [ "人工智能", "Broadcom", "Oracle" ], "postIdeas": [ "AI板块估值是否过高", "AI基础设施建设的挑战" ] }, { "title": "iRobot申请破产保护，被主要供应商收购", "date": "2025-12-14", "content": "扫地机器人制造商iRobot宣布通过法院监督的预先打包的Chapter 11程序进行重组", "tags": [ "iRobot", "消费电子", "Picea" ], "postIdeas": [ "品牌如何应对债务危机", "科技公司M&A对供应链影响" ] }, { "title": "韩元疲软吸引外资，韩国M&A交易激增", "date": "2025-12-14", "content": "由于韩元的急剧贬值，导致韩国企业的估值对海外买家更具吸引力，今年前九个月外国对韩国公司的收购金额激增，已接近历史最高纪录。", "tags": [ "外汇贬值", "跨境并购", "公司法改革" ], "postIdeas": [ "韩元贬值对产业的影响", "外资收购韩国资产的趋势" ] } ], "summary": "全球金融市场聚焦本周央行决议，美联储降息后的乐观情绪受到AI板块估值担忧和大型科技公司财报压力的考验", "title": "AI股估值遇冷，全球央行决议周来临：昨日四大财经头条" };
    const targetLanguages = ['zh-HK', 'en'];
    const result = await translateResearchDoc({ doc, targetLanguages });
    console.log('result', result.object, result.usage);
    researchDocSchema.parse(result.object);
  }, 30e3);
  it('get latest need translate docs', async () => {
    const result = await translateLatestResearchDocs();
    for await (const item of result) {
      console.log('yield item', item);
    }
  }, 120e3);
});