import { LocalMongoModel, parseMongoFilter } from "./local-mongo-model";

const sampleData = [
  { _id: '1', a: 1, b: 2, c: 3 },
  { _id: '2', a: 2, b: 2, c: 4 },
  { _id: '3', a: 3, b: 4, c: 5 },
];
describe('local-mongo-model', () => {
  const Model = new LocalMongoModel('test');
  beforeEach(async () => {
    await Model.deleteMany({}, {});
    await Model.insertMany(sampleData, {});
    expect(await Model.countDocuments({})).toBe(3);
  });
  // test.skip('mongo-test', async () => {
  //   const schema = new mongoose.Schema({ name: String });
  //   const TestModel = mongoose.model('test', schema);
  //   // const res = await TestModel.deleteMany({ name: 'test' })
  //   // const doc = await TestModel.findOne({ name: 'test' })
  //   // const doc = new TestModel({ name: 'test' });
  //   // const doc = await TestModel.updateMany({ name: 'test' }, { name: 'test-modified' });
  //   // const doc = await TestModel.updateOne({ name: 'test' }, { name: 'test-modified' }, { upsert: true });
  // });
  test('get-started', async () => {
    const doc = await Model.findOne({ a: 1 });
    await doc.set({ bar: 'boo', date: new Date }).save();
    expect(doc.get('bar')).toBe('boo');
    expect(await Model.countDocuments({ b: 2 })).toBe(2);
    const doc2 = await Model.create({ a: 4, b: 5, c: 6 });
    // console.log('doc2', doc2.toJSON())
  });
  test('updateMany', async () => {
    const doc = await Model.findOneAndUpdate({ a: 1 }, { $set: { a: 10, 'obj.a': 1 }}, { new: true });
    expect(doc.get('a')).toBe(10);
    expect(doc.get('obj.a')).toBe(1);
  });
  test('parseMongoFilter', () => {
    expect(parseMongoFilter({ a: 1, b: { $gt: 1 } })).toEqual({ a: 1, b: { $gt: 1 } });
    expect(parseMongoFilter({ a: new Date('2025-01-01T00:00:00Z') })).toEqual({ a: '2025-01-01T00:00:00.000Z' });
  })

  test('find with sort', async () => {
    await Model.create({ a: 4, b: { nested: 10 } });
    // 测试基本升序排序
    const ascendingResults = await Model.find({}).sort({ a: 1 }).exec();
    expect(ascendingResults.map((doc: any) => doc.get('a'))).toEqual([1, 2, 3, 4]);

    // 测试基本降序排序
    const descendingResults = await Model.find({}).sort({ a: -1 }).exec();
    expect(descendingResults.map((doc: any) => doc.get('a'))).toEqual([4, 3, 2, 1]);

    // 测试字符串形式的排序
    const stringSortAsc = await Model.find({}).sort('a').exec();
    expect(stringSortAsc.map((doc: any) => doc.get('a'))).toEqual([1, 2, 3, 4]);

    const stringSortDesc = await Model.find({}).sort('-a').exec();
    expect(stringSortDesc.map((doc: any) => doc.get('a'))).toEqual([4, 3, 2, 1]);
  });

  test('find with sort and filter', async () => {
    // 添加一些测试数据用于嵌套字段排序
    await Model.create({ a: 5, b: { nested: 10 } });
    await Model.create({ a: 6, b: { nested: 5 } });

    // 测试带过滤条件的排序
    const filteredSortResults = await Model.find({ a: { $gt: 2 } }).sort({ a: 1 }).exec();
    console.log('filteredSortResults', await Model.find({ a: { $gt: 2 } }).lean());
    expect(filteredSortResults.map((doc: any) => doc.get('a'))).toEqual([3, 5, 6]);

    // 测试嵌套字段排序
    const nestedSortAsc = await Model.find({ a: { $gt: 4 } }).sort({ 'b.nested': 1 }).exec();
    expect(nestedSortAsc.map((doc: any) => doc.get('b.nested'))).toEqual([5, 10]);

    const nestedSortDesc = await Model.find({ a: { $gt: 4 } }).sort({ 'b.nested': -1 }).exec();
    expect(nestedSortDesc.map((doc: any) => doc.get('b.nested'))).toEqual([10, 5]);
  });

  test('find with sort, limit and skip', async () => {
    // 测试排序、限制和跳过的组合
    const combinedResults = await Model.find({}).sort({ a: 1 }).skip(1).limit(2).exec();
    expect(combinedResults.map((doc: any) => doc.get('a'))).toEqual([2, 3]);

    // 测试降序排序与限制的组合
    const descLimitResults = await Model.find({}).sort({ a: -1 }).limit(2).exec();
    expect(descLimitResults.map((doc: any) => doc.get('a'))).toEqual([3,2]);
  });
});
