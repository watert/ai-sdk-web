import { parseMongoQuery, parseMongoQueryObj } from './parseMongoQuery';
// 假设您的 parseMongoQuery 函数在 mongoParser.js 文件中导出

describe('parseMongoQuery', () => {

  // 1. 基础类型转换
  test('converts numeric strings, boolean strings, and preserves other strings', () => {
    const query = { num: '123', float: '45.6', boolT: 'true', boolF: 'false', str: 'text', nul: null };
    const expected = { num: 123, float: 45.6, boolT: true, boolF: false, str: 'text', nul: null };
    expect(parseMongoQueryObj(query)).toEqual(expected);
  });
  test.only('$in array and $and array', () => {
    expect(parseMongoQueryObj({ $and: [{ tags: '1', level: { $gt: '5' } }, { id: { $in: ['foo', 'bar'] } }] })).toMatchInlineSnapshot(`
{
  "$and": [
    {
      "level": {
        "$gt": 5,
      },
      "tags": "1",
    },
    {
      "id": {
        "$in": [
          "foo",
          "bar",
        ],
      },
    },
  ],
}
`);
  })

  // 2. 正则表达式转换
  test('converts regex strings to RegExp objects', () => {
    const regexStr = '/pattern/gi';
    const result = parseMongoQueryObj({ field: regexStr });
    expect(result.field.source).toBe('pattern');
    expect(result.field.flags).toBe('gi');
    expect(result.field.toString()).toBe(regexStr); // Checks regStrParser override
    expect(result.field).toBeInstanceOf(RegExp);
  });

  // 3. 数组转换为 $all
  test('converts top-level arrays to {$all: [...] }', () => {
    const query = { tags: ['a', 'b'] };
    const expected = { tags: { $all: ['a', 'b'] } };
    expect(parseMongoQueryObj(query)).toEqual(expected);
  });

  // 4. 逻辑操作符递归
  test('recursively parses $and/$or clauses', () => {
    const query = { $and: [{ n: '50' }, { b: 'true' }, { a: ['x'] }] };
    const expected = { $and: [{ n: 50 }, { b: true }, { a: { $all: ['x'] } }] };
    expect(parseMongoQueryObj(query)).toEqual(expected);
  });

  // 5. 内嵌操作符值转换
  test('converts dates, numbers, and booleans within nested operators', () => {
    const dateStr = '2025-11-14T00:00:00.000Z';
    const query = {
      p: { $gte: '10', $lt: '99.9', other: 'test', $not: { $gt: '1' } },
      d: { $lte: dateStr },
      e: { $exists: 'true', val: 'false' },
      $or: [{ p: { $gt: '1' } }],
    };
    const result = parseMongoQueryObj(query);

    expect(result.p.$gte).toBe(10);
    expect(result.p.$lt).toBe(99.9);
    expect(result.p.other).toBe('test'); // Should remain string
    expect(result.p.$not.$gt).toBe(1);
    
    expect(result.d.$lte).toBeInstanceOf(Date);
    expect(result.d.$lte.toISOString()).toBe(dateStr);
    
    expect(result.e.$exists).toBe(true);
    expect(result.e.val).toBe(false); // Nested boolean conversion

    expect(result.$or[0].p.$gt).toBe(1);
  });

  // 6. 不可变性检查
  test('does not mutate the original query object', () => {
    const originalQuery = { p: '100', $or: [{ s: 'false' }] };
    const originalClone = JSON.parse(JSON.stringify(originalQuery));
    
    parseMongoQueryObj(originalQuery);
    
    expect(originalQuery).toEqual(originalClone);
  });
});