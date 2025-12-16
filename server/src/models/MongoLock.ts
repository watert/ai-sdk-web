import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { connectMongo } from "./mongo-index";

export const lockSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  expireAt: { type: Date, required: true },
  clientId: { type: String, required: true },
}, { timestamps: true });
lockSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }); // 创建 TTL 索引，自动删除过期文档（精确到秒）

export const LockModel = mongoose.model('locks', lockSchema);
LockModel.ensureIndexes();

// infer doc type
export type lockDocType = mongoose.InferSchemaType<typeof lockSchema>;
export async function getMongoLock(key: string, timeoutMs: number, _clientId?: string) {
  const clientId = _clientId || nanoid(); // 生成唯一客户端 ID
  const now = new Date();
  const newExpire = new Date(now.getTime() + timeoutMs);
  const maxUpdatedAt = new Date(now.getTime() - timeoutMs);
  try {
    // console.log('updated $lt', maxUpdatedAt);
    // 原子操作：尝试获取或更新锁
    const where = {
      key, $or: [
        { expireAt: { $lte: now } }, // 锁存在但已过期
        { updatedAt: { $lt: maxUpdatedAt } }, // 锁存在但 timeout 被更新
        { expireAt: { $exists: false } }, // 处理旧数据无 expireAt 的情况
      ],
    };
    // console.log('where', { timeoutMs, now }, JSON.stringify(where));
    const $set = { key, expireAt: newExpire, clientId };
    return await LockModel.findOneAndUpdate(where, { $set }, { upsert: true, new: true } ).lean();
  } catch (error: any) {
    if (error.code === 11000) {
      // 唯一键冲突，说明锁已被其他客户端持有
      // console.log('error', error, { now: new Date(now) }, await LockModel.findOne({ key }).lean())
      throw new Error(`LockObtainFail(${key})`);
    }
    throw error;
  }
}
export async function releaseMongoLock(key) {
  await LockModel.deleteOne({ key }).catch(() => { 1; });
  return true;
}
export async function withMongoLock(key, timeoutMs, func) {
  const clientId = nanoid(); // 生成唯一客户端 ID
  const lock = await getMongoLock(key, timeoutMs, clientId);

  // 确认锁是否被当前客户端获取
  if (lock && lock.clientId === clientId) {
    try {
      return await func(); // 执行用户函数
    } finally {
      // 无论成功与否，释放锁（根据 clientId 确保安全）
      await releaseMongoLock(key);
      // await LockModel.deleteOne({ key, clientId }).catch(() => { 1; });
    }
  } else {
    // 锁已被其他客户端持有
    throw new Error(`LockObtainFail(${key})`);
  }
}
