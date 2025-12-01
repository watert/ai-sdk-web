import { handleIndustryResearchTask } from "./industry-research";

describe('industry-research', () => {
  test('should handleIndustryResearchTask', async () => {
    const res = handleIndustryResearchTask({
      // platform: 'GEMINI', model: 'gemini-flash-latest',
      platform: 'QWEN', model: 'qwen-plus',
      industryId: 'ai', config: 'DAILY_NEWS', local: true,
      // industryId: 'ai', config: 'WEEKLY_NEWS', local: true,
    });
    console.log('res', await res.text);
    await res.taskResult;
  }, 30e3)
});