import { connectMongo } from "../models/mongo-index";
import { handleIndustryResearchTask } from "./industry-research";

describe('industry-research', () => {
  beforeAll(async () => {
    await connectMongo();
  });
  test.only('should handleIndustryResearchTask', async () => {
    const res = await handleIndustryResearchTask({
      // platform: 'GEMINI', model: 'gemini-flash-latest',
      // thinking: true,
      industryId: 'finance', config: 'DAILY_NEWS',
      // industryId: 'ai', config: 'HOT_TOPICS',
      // local: true,
    });
    console.log('res', await res.taskResult);
    await res.taskResult;
  }, 30e3)
});