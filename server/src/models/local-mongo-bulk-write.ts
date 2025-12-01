import _ from "lodash";
// 假设这是你提供的 helper 路径
import collectionMatch from "./collection-match";
import { mongoUpdateItem } from "./local-mongo-update-item";

// 简单的 ID 生成器，如果没有引入 bson/uuid 库
const genObjId = () => {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    "xxxxxxxxxxxxxxxx".replace(/[x]/g, () => ((Math.random() * 16) | 0).toString(16)).toLowerCase()
  );
};

// 定义返回结果的类型（简化版 MongoDB BulkWriteResult）
interface BulkWriteResult {
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
  upsertedCount: number;
  upsertedIds: { [index: number]: any };
}

export function memoryBulkWrite(
  data: any[],
  operations: any[]
): Promise<{ data: any[]; result: BulkWriteResult }> {
  return new Promise((resolve, reject) => {
    try {
      // 1. 构建索引：_id -> 对象引用
      // 注意：keyBy 创建的是对象的浅拷贝引用映射，修改 map 中的对象属性会影响原数组中的对象
      const idMap = _.keyBy(data, "_id");

      const result: BulkWriteResult = {
        insertedCount: 0,
        matchedCount: 0,
        modifiedCount: 0,
        deletedCount: 0,
        upsertedCount: 0,
        upsertedIds: {},
      };

      // 辅助函数：高效查找
      const findItem = (filter: any) => {
        // 优化：如果 filter 仅包含 _id 且为字符串，直接查 Map
        if (
          filter &&
          typeof filter._id === "string" &&
          Object.keys(filter).length === 1
        ) {
          return idMap[filter._id];
        }
        // 降级：遍历查找
        return data.find((item) => collectionMatch(item, filter));
      };

      // 2. 顺序执行操作
      operations.forEach((opWrapper, opIndex) => {
        const opType = Object.keys(opWrapper)[0];
        const op = opWrapper[opType];

        if (opType === "insertOne") {
          const doc = op.document;
          if (!doc._id) doc._id = genObjId();

          data.push(doc);
          idMap[doc._id] = doc; // 更新索引
          result.insertedCount++;
        } else if (opType === "updateOne" || opType === "replaceOne") {
          const item = findItem(op.filter);

          if (item) {
            result.matchedCount++;

            let newItem;
            if (opType === "replaceOne") {
              // replaceOne 完全替换，但保留 _id (如果 replacement 中没有 _id)
              newItem = { _id: item._id, ...op.replacement };
            } else {
              // updateOne 使用 mongoUpdateItem 处理操作符 ($set, $push 等)
              // 注意：这里假设 mongoUpdateItem 返回一个新的对象状态
              newItem = mongoUpdateItem({ ...item }, op.update);
            }

            // 核心优化：原地修改对象引用，避免在 data 数组中寻找索引并 splice/replace
            // 1. 清空原对象所有属性
            Object.keys(item).forEach((key) => delete item[key]);
            // 2. 赋予新属性
            Object.assign(item, newItem);

            // 如果 _id 变了（极少情况），需要更新 map
            if (newItem._id !== item._id) {
              delete idMap[item._id]; // 此时 item._id 已经是新的了，逻辑上会有问题，通常 _id 不允许修改。
              // 这里假定 _id 不变，或忽略 _id 修改的复杂性
              idMap[newItem._id] = item;
            }

            result.modifiedCount++;
          } else if (op.upsert) {
            // Upsert 逻辑
            const newId = genObjId();
            const baseDoc: any = { _id: newId };

            // 尝试从 filter 中提取简单的等值条件作为初始值
            // 例如 filter: { name: "A" } -> baseDoc: { _id:..., name: "A" }
            // 这一步是 Mongo 的标准行为，但实现比较复杂，这里做简单合并
            if (op.filter && typeof op.filter === "object") {
              _.forEach(op.filter, (val, key) => {
                if (!key.startsWith("$") && typeof val !== "object") {
                  baseDoc[key] = val;
                }
              });
            }

            let newItem;
            if (opType === "replaceOne") {
              newItem = { ...baseDoc, ...op.replacement };
            } else {
              newItem = mongoUpdateItem(baseDoc, op.update);
            }

            if (!newItem._id) newItem._id = newId;

            data.push(newItem);
            idMap[newItem._id] = newItem;

            result.upsertedCount++;
            result.upsertedIds[opIndex] = newItem._id;
          }
        } else if (opType === "updateMany") {
          // updateMany 必须遍历，无法利用单一 id 索引优化，除非 filter 也是 _id 列表
          // 这里使用 filter 遍历所有匹配项
          const itemsToUpdate = data.filter((item) =>
            collectionMatch(item, op.filter)
          );

          if (itemsToUpdate.length > 0) {
            result.matchedCount += itemsToUpdate.length;
            itemsToUpdate.forEach((item) => {
              const newItem = mongoUpdateItem({ ...item }, op.update);
              Object.keys(item).forEach((key) => delete item[key]);
              Object.assign(item, newItem);
            });
            result.modifiedCount += itemsToUpdate.length;
          } else if (op.upsert) {
            // updateMany 的 upsert 逻辑同 updateOne，只插入一条
            // 这里复用上面的逻辑，简化处理
            const newId = genObjId();
            const baseDoc = { _id: newId };
            // 合并 filter 简单字段... (略，同上)
            const newItem: any = mongoUpdateItem(baseDoc, op.update);
            data.push(newItem);
            idMap[newItem._id] = newItem;
            result.upsertedCount++;
            result.upsertedIds[opIndex] = newItem._id;
          }
        } else if (opType === "deleteOne") {
          const item = findItem(op.filter);
          if (item) {
            // 必须找到它在数组中的真实位置进行移除
            const idx = data.indexOf(item);
            if (idx > -1) {
              data.splice(idx, 1);
              delete idMap[item._id];
              result.deletedCount++;
            }
          }
        } else if (opType === "deleteMany") {
          // 找出所有需要删除的项
          const itemsToDelete = data.filter((item) =>
            collectionMatch(item, op.filter)
          );
          const count = itemsToDelete.length;
          if (count > 0) {
            // 批量删除，为了性能，建议重建数组或倒序删除
            // 这里采用 lodash remove 或者 filter 重建 data
            // 注意：直接修改 data 引用通常不可行 (data = data.filter)，因为我们要返回修改后的 data
            // 且如果外部持有 data 的引用，直接赋值无效。
            // 最好使用 splice 倒序删除，或者如果允许返回新数组：

            // 方案 A: 倒序 Splice (保持数组引用)
            for (let i = data.length - 1; i >= 0; i--) {
              if (collectionMatch(data[i], op.filter)) {
                delete idMap[data[i]._id];
                data.splice(i, 1);
              }
            }
            result.deletedCount += count;
          }
        }
      });

      resolve({ data, result });
    } catch (error) {
      reject(error);
    }
  });
}
