import { mongoUpdateItem } from './local-mongo-update-item'; // 假设文件名为 mongoUpdateItem.ts

describe('mongoUpdateItem', () => {
  // 基础测试数据 fixture
  const getBase = () => ({
    info: { name: 'Alice', age: 25 },
    stats: { score: 10, views: 0 },
    tags: ['a', 'b'],
    items: [{ id: 1, val: 10 }, { id: 2, val: 20 }],
    flags: 5 // binary 0101
  });

  test('should maintain immutability', () => {
    const original = getBase();
    const updated = mongoUpdateItem(original, { $set: { 'info.age': 30 } });
    
    expect(updated).not.toBe(original);
    expect(original.info.age).toBe(25); // 原对象未变
    expect(updated).toEqual(expect.objectContaining({ info: { name: 'Alice', age: 30 } }));
  });

  test('should handle Field operators ($set, $unset, $rename)', () => {
    const result = mongoUpdateItem(getBase(), {
      $set: { 'info.city': 'NY', 'stats.score': 100 },
      $unset: { 'info.age': '' },
      $rename: { 'stats.views': 'stats.seen' }
    });

    expect(result).toEqual({
      info: { name: 'Alice', city: 'NY' }, // age removed, city added
      stats: { score: 100, seen: 0 },       // score updated, views renamed to seen
      tags: ['a', 'b'],
      items: [{ id: 1, val: 10 }, { id: 2, val: 20 }],
      flags: 5
    });
  });

  test('should handle Math operators ($inc, $mul, $min, $max)', () => {
    const result = mongoUpdateItem(getBase(), {
      $inc: { 'stats.score': 5, 'stats.new': 1 }, // existing & new
      $mul: { 'stats.views': 2 },                 // 0 * 2 = 0
      $min: { 'info.age': 20 },                   // 25 vs 20 -> 20
      $max: { 'flags': 10 }                       // 5 vs 10 -> 10
    });

    expect((result as any).stats.score).toBe(15);
    expect((result as any).stats.new).toBe(1);
    expect((result as any).info.age).toBe(20);
    expect((result as any).flags).toBe(10);
  });

  test('should handle Array Addition ($push, $addToSet)', () => {
    const result = mongoUpdateItem(getBase(), {
      $push: { 
        tags: 'c', 
        'items': { $each: [{ id: 3 }] } // test $each
      },
      $addToSet: { 
        tags: { $each: ['a', 'd'] },    // 'a' exists (ignore), 'd' is new
        'items': { id: 1, val: 10 }     // object exists (deep compare)
      }
    });

    expect((result as any).tags).toEqual(['a', 'b', 'c', 'd']);
    expect((result as any).items).toHaveLength(3); // only id:3 added
    expect((result as any).items[2]).toEqual({ id: 3 });
  });

  test('should handle Array Removal ($pop, $pull, $pullAll)', () => {
    const result = mongoUpdateItem(getBase(), {
      $pop: { tags: 1 }, // remove last ('b')
      $pull: { items: { id: 1 } }, // remove by query/match
      $pullAll: { tags: ['a'] }    // remove 'a' (but 'b' was popped, check order)
    });
    
    // logic: tags ['a', 'b'] -> pop(1) -> ['a'] -> pullAll(['a']) -> []
    expect((result as any).tags).toEqual([]);
    expect((result as any).items).toEqual([{ id: 2, val: 20 }]);
  });

  test('should handle $bit operator', () => {
    // flags: 5 (0101)
    const result = mongoUpdateItem(getBase(), {
      $bit: { 
        flags: { and: 6, or: 8 } 
        // 5 & 6 -> 0101 & 0110 = 0100 (4)
        // 4 | 8 -> 0100 | 1000 = 1100 (12)
      }
    });
    // Note: Depending on implementation order. 
    // If parallel: handled sequentially in lodash forEach loop on keys.
    // Let's assume sequential application based on object key order or implementation.
    // Actually, implementation does: val = val & and; val = val | or;
    expect((result as any).flags).toBe(12); 
  });

  test('should handle $currentDate', () => {
    const result = mongoUpdateItem(getBase(), {
      $currentDate: { 'info.updatedAt': true }
    });
    expect((result as any).info.updatedAt).toBeInstanceOf(Date);
  });

  test('should throw errors on invalid input', () => {
    expect(() => mongoUpdateItem([], {})).toThrow(/not support array/);
    expect(() => mongoUpdateItem({}, [])).toThrow(/not support array pipeline/);
    // Optional: Test applying array op to non-array
    expect(() => mongoUpdateItem({ a: 1 }, { $push: { a: 1 } })).toThrow();
  });
});