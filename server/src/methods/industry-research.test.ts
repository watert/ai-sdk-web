import { handleIndustryResearchTask } from "./industry-research";

describe('industry-research', () => {
  test.only('should handleIndustryResearchTask', async () => {
    const res = handleIndustryResearchTask({
      platform: 'GEMINI', model: 'gemini-flash-latest', thinking: true,
      // platform: 'QWEN', model: 'qwen-plus',
      industryId: 'ai', config: 'HOT_TOPICS', local: true,
      // industryId: 'ai', config: 'MONTHLY_TRENDS', local: true,
      // industryId: 'ai', config: 'DAILY_NEWS', local: true,
      // industryId: 'ai', config: 'WEEKLY_NEWS', local: true,
    });
    console.log('res', await res.text);
    await res.taskResult;
  }, 30e3)
});