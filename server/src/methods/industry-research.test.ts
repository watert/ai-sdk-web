import { handleIndustryResearchTask } from "./industry-research";

describe('industry-research', () => {
  test('should handleIndustryResearchTask', async () => {
    const res = handleIndustryResearchTask({
      industryId: 'ai', config: 'WEEKLY_NEWS', local: true,
    });
    console.log('res', res);
    await res.taskResult;
  }, 30e3)
});