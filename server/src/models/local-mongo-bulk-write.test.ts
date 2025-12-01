import { memoryBulkWrite } from './local-mongo-bulk-write'; // 修改为实际路径

// 1. Mock 依赖：简化匹配和更新逻辑，确保测试聚焦于 BulkWrite 本身
jest.mock("./collection-match", () => (item: any, filter: any) => {
  // 简易模拟：仅支持一级属性全等匹配
  return Object.entries(filter).every(([k, v]) => item[k] === v);
});

jest.mock("./local-mongo-update-item", () => ({
  mongoUpdateItem: (item: any, update: any) => {
    // 简易模拟：仅支持 $set
    return { ...item, ...(update.$set || {}) };
  }
}));

describe('memoryBulkWrite', () => {
  let data: any[];

  beforeEach(() => {
    // 每次测试重置数据
    data = [{ _id: '1', val: 10, type: 'A' }, { _id: '2', val: 20, type: 'A' }, { _id: '3', val: 30, type: 'B' }];
  });

  test('insertOne: should add item and return result', async () => {
    const ops = [{ insertOne: { document: { _id: '4', val: 40 } } }];
    const { result } = await memoryBulkWrite(data, ops);
    
    expect(data).toHaveLength(4);
    expect(data[3]).toEqual({ _id: '4', val: 40 });
    expect(result.insertedCount).toBe(1);
  });

  test('updateOne: should update by _id (optimized) and match filter', async () => {
    const ops = [
      { updateOne: { filter: { _id: '1' }, update: { $set: { val: 99 } } } }, // ID 命中
      { updateOne: { filter: { val: 20 }, update: { $set: { val: 88 } } } }   // 普通 filter 命中
    ];
    const { result } = await memoryBulkWrite(data, ops);

    expect(data.find(i => i._id === '1')?.val).toBe(99);
    expect(data.find(i => i._id === '2')?.val).toBe(88);
    expect(result.modifiedCount).toBe(2);
  });

  test('updateOne (Upsert): should insert when not found', async () => {
    const ops = [{ updateOne: { filter: { _id: 'new' }, update: { $set: { val: 100 } }, upsert: true } }];
    const { result } = await memoryBulkWrite(data, ops);

    expect(data).toHaveLength(4);
    expect(data.find(i => i.val === 100)).toMatchObject({ _id: expect.any(String), val: 100 });
    expect(result.upsertedCount).toBe(1);
  });

  test('updateMany: should update multiple items', async () => {
    const ops = [{ updateMany: { filter: { type: 'A' }, update: { $set: { active: true } } } }];
    const { result } = await memoryBulkWrite(data, ops);

    expect(data.filter(i => i.active)).toHaveLength(2); // ID 1 和 2
    expect(data.find(i => i._id === '3')).not.toHaveProperty('active');
    expect(result.modifiedCount).toBe(2);
  });

  test('deleteOne & deleteMany: should remove items correctly', async () => {
    const ops = [
      { deleteOne: { filter: { _id: '1' } } },
      { deleteMany: { filter: { type: 'B' } } } // 删除 ID 3
    ];
    const { result } = await memoryBulkWrite(data, ops);

    expect(data).toHaveLength(1);
    expect(data[0]._id).toBe('2'); // 只剩 ID 2
    expect(result.deletedCount).toBe(2);
  });

  test('replaceOne: should completely replace document', async () => {
    const ops = [{ replaceOne: { filter: { _id: '1' }, replacement: { newVal: 'replaced' } } }];
    await memoryBulkWrite(data, ops);

    const item = data.find(i => i._id === '1');
    expect(item).toEqual({ _id: '1', newVal: 'replaced' }); // val 和 type 字段应消失
    expect(item).not.toHaveProperty('val');
  });

  test('Mixed Operations: should handle sequence correctly', async () => {
    const ops = [
      { insertOne: { document: { _id: '4', type: 'C' } } },
      { updateOne: { filter: { _id: '4' }, update: { $set: { val: 40 } } } },
      { deleteOne: { filter: { _id: '1' } } }
    ];
    const { result } = await memoryBulkWrite(data, ops);

    expect(data).toHaveLength(3); // 3 init - 1 del + 1 ins
    expect(data.find(i => i._id === '4')).toEqual({ _id: '4', type: 'C', val: 40 });
    expect(result).toMatchObject({ insertedCount: 1, modifiedCount: 1, deletedCount: 1 });
  });
});