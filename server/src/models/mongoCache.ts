import mongoose from "mongoose";
import { connectExtData } from "./mongo-index";

const MongoCacheSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
  generatedAt: { type: Date, required: true },
  expiredAt: { type: Date, required: true },
}, { timestamps: true, strict: false });
MongoCacheSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 1 })
const MongoCacheModel = connectExtData().model('caches', MongoCacheSchema);

export async function clearMongoCache(key: string | string[]) {
  await MongoCacheModel.deleteMany({ key: { $in: ([] as any).concat(key) } });
}
export async function mongoCache(key: string, fn: (() => any | Promise<any>) | any, { force = false, ttlSeconds = 120 } = {}) {
  console.log('typeof fn', typeof fn);
  if (typeof fn === 'function') { // try get cache first
    const doc = await MongoCacheModel.findOne({ key });
    const isExpired = (doc?.expiredAt && (new Date(doc.expiredAt)).getTime() < Date.now())
      || (doc?.generatedAt && ((new Date(doc.generatedAt)).getTime() + ttlSeconds * 1e3) < Date.now())
      || !doc?.generatedAt || force;
    if (doc === null || isExpired) {
      const value = await Promise.resolve(fn()).catch(err => {
        throw err;
      });
      const expiredAt = new Date(Date.now() + ttlSeconds * 1e3);
      const generatedAt = new Date();
      await MongoCacheModel.updateOne({ key }, { key, value: JSON.stringify(value), generatedAt, expiredAt }, { upsert: true })
      return value;
    }
    return JSON.parse(doc.value);
  }
  if (typeof fn === 'undefined') {
    const doc = await MongoCacheModel.findOne({ key });
    if (typeof doc === 'undefined' || doc === null) return null;
    return JSON.parse(doc.value);
  }
  throw new Error('not implemented');
}