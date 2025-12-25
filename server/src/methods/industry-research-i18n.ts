import _ from "lodash";
import { getLatestResearchDocs, IndustryResearchModel, localIndustryModel, ResearchDoc, researchDocSchema } from "./industry-research";
import z from "zod";
import { generateObject } from "ai";
import { makeAsyncIterable } from "../libs/makeAsyncIterable";
import { prepareAiSdkRequest } from "./ai-sdk/ai-sdk-utils";

const systemPrompt = `
你是一个专业的翻译，擅长将 JSON 格式的数据翻译按照用户的指令翻译为其他语言。
JSON 的 schema 结构及其 key names 等保持不变。
`.trim();

export const researchTargetLanguages = ['zh-HK', 'en'] as string[];

export async function translateResearchDoc({ doc, targetLanguages = researchTargetLanguages }: { doc: ResearchDoc, targetLanguages?: string[] }) {
  doc = _.pick(doc, ['inspirations', 'summary', 'title']);
  researchDocSchema.parse(doc);
  const outputSchema = z.object(_.fromPairs(targetLanguages.map((lang) => [lang, researchDocSchema])));
  // console.log('outputSchema', outputSchema, _.keyBy(targetLanguages, (lang) => researchDocSchema));
  const { params, info } = prepareAiSdkRequest({
    platform: 'GEMINI', model: 'gemini-2.5-flash-lite', system: systemPrompt,
    prompt: `
${JSON.stringify(doc, null, 2)}

---
请将以上 JSON 数据翻译为 ${targetLanguages.join(', ')} 语言，返回 Record<lang: string, translated: object> 格式的 JSON 数据。
`,
  });
  return await generateObject({ ...params, schema: outputSchema });
}

export async function translateResearchDBDoc({ doc, dbModel = IndustryResearchModel, targetLanguages = researchTargetLanguages }: {
  doc: any, targetLanguages: string[], dbModel?: typeof IndustryResearchModel,
}) {
  const { json, locales = {} } = doc.data;
  if (!doc._id) { throw new Error('doc._id is required for db update'); }
  const result = await translateResearchDoc({ doc: json });
  return await dbModel.findOneAndUpdate({ _id: doc._id }, {
    $set: {
      'data.locales': result.object,
      'data.i18nUsage': result.usage,
    },
  }, { new: true }).lean();
}

export async function translateLatestResearchDocs({
  local, dbModel, where, docs, targetLanguages = researchTargetLanguages,
  maxDocs = 10,
}: {
  docs?: any[], where?: any, targetLanguages?: string[], local?: boolean,
  dbModel?: typeof IndustryResearchModel,
  maxDocs?: number,
} = {}) {
  if (!dbModel && local) { dbModel = localIndustryModel as any; }
  if (!dbModel) { dbModel = IndustryResearchModel; }
  if (!dbModel) { throw new Error('dbModel is required'); }
  if (!docs) {
    docs = await getLatestResearchDocs({ $match: where, dbModel });
    docs = docs.filter((doc: any) => {
      if (!researchDocSchema.safeParse(doc.data.json).success) return false;
      const hasLocales = Object.keys(doc.data.locales || {});
      return targetLanguages.some(lang => {
        const parsed = researchDocSchema.safeParse(doc.data?.locales?.[lang]);
        return !parsed.success || !hasLocales.includes(lang);
      });
    });
  }
  
  return makeAsyncIterable(async function(yieldItem) {
    if (!docs.length) { yieldItem({ msg: "[i18n:FIN] no docs to translate" }); return; }
    const count = Math.min(docs.length, maxDocs);
    yieldItem({ msg: "[i18n:PND] translate task started:", count });
    for (const doc of docs.slice(0, maxDocs)) { // max times
      const idx = docs.indexOf(doc);
      yieldItem({ msg: "[i18n:ACT] translate started:", idx, taskTime: doc.taskTime, calendarId: doc.calendarId });
      const result = await translateResearchDBDoc({ doc, dbModel, targetLanguages });
      yieldItem({ msg: "[i18n:FIN] translate doc item done", idx, taskTime: doc.taskTime, calendarId: doc.calendarId, usage: result?.data?.i18nUsage });
    }
    yieldItem({ msg: "[i18n:FIN] translate task done", count });
  });
}