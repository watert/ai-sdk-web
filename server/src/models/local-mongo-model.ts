import { LOCAL_DATA_PATH } from "../config";
import * as fs from 'fs-extra';
import * as path from 'path';
import _ from "lodash";
import collectionMatch from "./collection-match";
import { mongoUpdateItem } from "./local-mongo-update-item";
import { memoryBulkWrite } from "./local-mongo-bulk-write";

const fileBasePath = LOCAL_DATA_PATH;

const genObjId = () => {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    "xxxxxxxxxxxxxxxx".replace(/[x]/g, () => ((Math.random() * 16) | 0).toString(16)).toLowerCase()
  );
};

export class LocalMongoDocument<T = any> {
  constructor(public model: LocalMongoModel, public data: any) {
    this.model = model;
    this.data = mongoUpdateItem({ _id: data._id || genObjId() }, data);
    // data = mongoUpdateItem({ _id: data._id || genObjId() }, data)
  }
  get _id() { return this.data._id; }
  set(key: string | object, value?: any) {
    if (typeof value === 'undefined' && typeof key === 'object') {
      Object.entries(key).forEach(([k, v]) => _.set(this.data, k, v));
      return this;
    }
    if (typeof key !== 'string') {
      throw new Error('invalid key');
    }
    _.set(this.data, key as string, value); return this;
  }
  get(key: string) { return _.get(this.data, key); }
  toJSON(): T { return this.data; }
  async save() {
    const data = await this.model.loadLocalCollection();
    // console.log("saving", data, this.data)
    const index = data.findIndex(v => v._id === this.data._id);
    if (index === -1) {
      data.push(this.data);
    } else {
      data[index] = this.data;
    }
    await this.model.saveLocalCollection(data);
    return this;
  }
}
export class LocalMongoQuery<T = any> { // internal query object. LocalMongoQuery.fromFind(where);
  opts: any = {};
  model: LocalMongoModel;
  projection: any;
  constructor(model: LocalMongoModel, projection?: any, opts?: any) {
    this.model = model;
    this.projection = projection;
    this.opts = opts || {};
  }
  static fromFind(model: LocalMongoModel, filter = {}, projection?: any, opts?: any) {
    return (new LocalMongoQuery(model, projection, opts)).where(filter);
  }
  setOptions(opts: any) { this.opts = opts; return this; }
  where(filter: any) { this.opts.filter = parseMongoFilter(filter); return this; }
  sort(sort: any) { this.opts.sort = sort; return this; }
  limit(limit: number) { this.opts.limit = limit; return this; }
  skip(skip: number) { this.opts.skip = skip; return this; }
  // then(resolve, reject): PromiseLike<any> {
  //   return Promise.resolve(this.exec()).then(resolve, reject);
  // }
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.exec()).then(onfulfilled as any, onrejected);
  }
  async exec(): Promise<T[] | any> {
    const items = ([] as any[]).concat((await this.lean()));
    const res = items.filter(r => r).map(v => new LocalMongoDocument(this.model, v));
    return this.opts.isOne ? res[0] : res;
  }
  async lean() {
    let data = await this.model.loadLocalCollection();
    if (this.opts?.filter) {
      data = data.filter(v => collectionMatch(v, this.opts.filter));
    }
    if (this.opts?.sort) {
      let { sort } = this.opts;
      if (typeof sort === 'string' && sort.startsWith('-')) {
        sort = { [sort.slice(1)]: -1 };
      } else if (typeof sort === 'string') {
        sort = { [sort]: 1 };
      }
      // console.log('sort', sort);
      const key = Object.keys(sort)[0];
      const sorter = (row: any) => _.get(row, key, 0);
      data = _.sortBy(data, sorter);
      const sortVal = _.get(sort, key, 0);
      if (sortVal < 0 || sortVal === false) {
        data = data.reverse();
      }
    }
    const skip = this.opts.skip || 0;
    let { limit } = this.opts;
    if (limit) limit += skip;
    const res = data.slice(skip, limit);
    return this.opts.isOne ? res[0] : res;
  }
}

export function parseMongoFilter(filter?: any): any {
  if (!filter) return filter;
  return _.mapValues(filter, (v: any, k: any) => {
    if (k.startsWith('$')) { return parseMongoFilter(v); }
    if(_.isDate(v)) { return v.toISOString(); }
    return v;
  });
}
export class LocalMongoModel<T = any> {
  // static collection: string;
  collection?: string;
  constructor(collectionOrDocument?: string | object) {
    if (typeof collectionOrDocument === 'string') {
      this.collection = collectionOrDocument;
    } else {
      return new LocalMongoDocument(this, collectionOrDocument) as any;
    }
  }
  static fromCollection(collection: string) {
    return new LocalMongoModel(collection);
  }
  async create(data: any) {
    return (new LocalMongoDocument(this, data)).save();
  }
  async countDocuments(filter?: any, opts?: any) {
    return (await this.find(filter, null, opts).exec() as any).length;
  }
  find(filter: any, projection?: any, options?: any): LocalMongoQuery {
    return LocalMongoQuery.fromFind(this, filter, projection, options) as any;
  }
  findOne(filter: any, projection?: any, options?: any) {
    return LocalMongoQuery.fromFind(this, filter, projection, { ...options || {}, isOne: true }).limit(1);
  }
  findOneAndUpdate(filter: any, update: object, opts?: { projection?: any, sort?: any, upsert?: boolean, returnDocument?: 'after' | 'before', new?: boolean }): any {
    const promise = Promise.resolve().then(async () => {
      const doc: LocalMongoDocument<T> = await this.findOne(filter, opts?.projection, opts).exec() as any;
      if (!doc && opts?.upsert) {
        return (await this.create(update)).toJSON();
      } else if (!doc) { return null; }
      const { data } = doc;
      doc.data = mongoUpdateItem(data, _.omit(update, '_id'));
      await doc.save();
      const isReturnAfter = opts?.returnDocument === 'after' || (!opts?.returnDocument && opts?.new);
      if (isReturnAfter) {
        return this.findOne({ _id: doc._id });
      }
      return new LocalMongoDocument(this, data);
    });
    Object.assign(promise, { lean: () => promise.then(d => !d ? null: d?.toJSON?.()) });
    return promise;
  }
  async updateOne(filter: any, update: any, opts?: any) {
    const doc: LocalMongoDocument<T> = await this.findOne(filter, null, opts).exec() as any;
    if (!doc) { return { acknowledged: true, modifiedCount: 0 } }
    doc.data = mongoUpdateItem(doc.data, update);
    await doc.save();
    return { acknowledged: true, modifiedCount: 1 }
  }
  async updateMany(filter: any, opts?: any) {
    let items = await this.loadLocalCollection();
    const updateItems: any[] = await this.find(filter, null, opts).exec() as any[];
    const updateItemsIds = _.uniq(([] as any[]).concat(updateItems)).map(v => v._id);
    items = items.map(item => !updateItemsIds.includes(item?._id) ? item: mongoUpdateItem(item, opts));
    await this.saveLocalCollection(items);
    return { acknowledged: true, modifiedCount: updateItemsIds.length }
  }
  async insertMany(docs: any[], _opts?: any) {
    const data = await this.loadLocalCollection();
    const byId = _.keyBy(data, '_id');
    docs.forEach(doc => {
      if (!doc._id) { doc._id = genObjId(); }
      if (byId[doc._id]) { throw new Error('duplicate _id'); }
      data.push(doc);
    });
    await this.saveLocalCollection(data);
    return { acknowledged: true, insertedCount: docs.length }
  }
  async deleteMany(filter: any, opts?: any) {
    let items = await this.loadLocalCollection();
    const deleteItemsIds = _.uniq((await this.find(filter, null, opts).exec() as any[]).map(v => v._id));
    items = items.filter(item => !deleteItemsIds.includes(item?._id));
    await this.saveLocalCollection(items);
    return { acknowledged: true, deletedCount: deleteItemsIds.length }
  }

  async deleteOne(filter: any, opts?: any) {
    let items = await this.loadLocalCollection();
    // 只查找第一个匹配的文档
    const doc = await this.findOne(filter, null, opts).exec() as LocalMongoDocument;
    if (!doc) {
      return { acknowledged: true, deletedCount: 0 };
    }
    // 过滤掉这个文档
    items = items.filter(item => item?._id !== doc._id);
    await this.saveLocalCollection(items);
    return { acknowledged: true, deletedCount: 1 };
  }
  async bulkWrite(operations: any[]) {
    const { data, result } = await memoryBulkWrite(await this.loadLocalCollection(), operations);
    await this.saveLocalCollection(data);
    return { acknowledged: true, ...result }
  }

  async saveLocalCollection(data: any[]) {
    const filePath = path.join(fileBasePath, this.collection + '.json');
    // await fs.writeJson(filePath, data, { spaces: 2 });
    // // TODO: 下面的紧凑模式不知道为什么不生效

    const str = `[\n${data.map((row, idx) => {
      const isLast = idx === data.length - 1;
      return '  ' + JSON.stringify(row) + (isLast ? '' : ',');
    }).join('\n')}\n]`;
    // console.log('str', str);
    await fs.writeFile(filePath, str, 'utf8');
  }
  async loadLocalCollection(): Promise<any[]> {
    const filePath = path.join(fileBasePath, this.collection + '.json');
    if (!await fs.exists(filePath)) {
      await fs.writeJson(filePath, []);
    }
    return fs.readJson(filePath).then(data => {
      return ([]).concat(data).map((r: any) => {
        if (!r._id) { r._id = genObjId(); }
        return r;
      });
    }, () => []);
  }
}

