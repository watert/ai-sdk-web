import _ from "lodash";
import { Model } from "mongoose";
import qs from "qs";
import { parseMongoQuery } from "./parseMongoQuery";


export type AppMongoQueryType = {
  $limit?: number; $sort?: any; $skip?: number; $select?: string | string[] | any;
} & Record<string, any>;


/**
 * usage with express: res.json(await queryMongoDocsWithTotal(model, req.query)) 
 * 检索的 query / body 参数可以是:
 * `$limit`: 限制返回的数量, number, 默认 20
 * `$skip`: 跳过的数量, number, 默认 0
 * `$sort`: 排序, 如 '-createdAt' 或 { createdAt: -1 }
 * `$select`: 选择返回的字段, string, 如 'title content'
 * 其他字段: 符合 mongodb find 协议
 * */
export async function queryMongoDocsWithTotal(model: Model<any>, mongoQuery: AppMongoQueryType) {
  const query = _.omit(mongoQuery, 'idField');
  const total = model.countDocuments(parseMongoQuery(_.omit(qs.parse(query), '$limit', '$skip', '$sort', '$select')));
  const data = await queryMongoDocs(model, query);
  return { total: await total, count: data.length, data };
}
export async function queryMongoDocs(model: Model<any>, query: AppMongoQueryType) {
  const { $limit = 20, $skip = 0, $sort = '-createdAt', $select, ...where } = qs.parse(query) as any;
  const parsedWhere = parseMongoQuery(where);
  console.log('parsedWhere', parsedWhere);
  return model.find(parsedWhere, $select).sort($sort).limit(_.toNumber($limit)).skip(_.toNumber($skip)).lean();
}

export const isDateStr = (str) => typeof str === 'string' && !!str.match(/.*-\d+-\d+[T\s].*\d+:\d+\d+.*(Z|\+[\d:]+)$/i);
export async function createMongoDoc(model, docBody) {
  const body = _.mapValues(docBody, (value, key) => isDateStr(value) ? new Date(value): value);
  return await model.create(body);
}
export async function putMongoDoc(model, body, { _id, idField = '_id' }: { idField?: string; _id?: string} = {}) {
  const $addToSet = body?.$addToSet || undefined;
  _id = _id || body[idField];
  const $set = _.mapValues(body?.$set || body, (value, key) => isDateStr(value) ? new Date(value): value);
  const update = _.omitBy({ $set, $addToSet }, _.isEmpty);
  // console.log(`Common putMongoDoc: ${model.modelName}/${_id} @${idField}`, update);
  const data = await model.findOneAndUpdate({ [idField]: _id }, update, { new: true, upsert: true }).lean();
  return data;
}

export async function batchUpdateMongoDocs(model: Model<any>, docs: any[], opts: { getFilter?: (doc: any) => any; idField?: string } = {}) {
  const { idField = '_id', getFilter } = opts;
  const updates = docs.map((doc) => {
    const filter = getFilter?.(doc) || { [idField]: doc[idField] };
    return {
      updateOne: {
        filter, update: { $set: { ...doc } }, upsert: true,
      },
    };
  });
  return await model.bulkWrite(updates);
}