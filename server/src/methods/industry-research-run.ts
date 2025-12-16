import { makeAsyncIterable } from "../libs/makeAsyncIterable";
import { baseIndustryResearchList, handleIndustryResearchTask } from "./industry-research";
import { translateLatestResearchDocs } from "./industry-research-i18n";

async function getIndustires() { return ['ai', 'finance'].map(id => ({ id })) }


export async function runAllIndustryResearches(params: { signal: AbortSignal }) {
  const industries = await getIndustires(); // read from current config
  return await makeAsyncIterable(async yieldItem => {
    yieldItem({ msg: `start ${industries.length} industry researches` });
    for (const industry of industries) {
      yieldItem({ industry: industry.id, msg: `industry ${industry.id}` });
      for (const config of baseIndustryResearchList) {
        yieldItem({ industry: industry.id, configId: config.id, msg: `industry ${industry.id} research ${config.id}` });
        if (params.signal.aborted) {
          yieldItem({ msg: `aborted due to ${params.signal.reason}` });
          throw new Error('SignalAborted');
        }
        const { taskResult } = await handleIndustryResearchTask({ industryId: industry.id, config });
        yieldItem({ industry: industry.id, configId: config.id, msg: `industry ${industry.id} research ${config.id} done`, ...(await taskResult)?.taskInfo });
        
        const translateTask = await translateLatestResearchDocs({ where: { calendarId: (await taskResult).calendarId} });
        for await (const chunk of translateTask) {
          yieldItem(chunk);
        }
      }
      yieldItem({ industry: industry.id, msg: `industry ${industry.id} all researches done` });
      // await translateResearchDBDoc({ doc, dbModel, targetLanguages })
    }
    yieldItem({ msg: `all ${industries.length} industry researches done` });
    const allI18nTask = await translateLatestResearchDocs();
    for await (const chunk of allI18nTask) {
      yieldItem(chunk);
    }
    yieldItem({ msg: `all task done` });
  });
}