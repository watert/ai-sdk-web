import { LocalMongoModel, parseMongoFilter } from "./local-mongo-model";

const sampleData = [
  { _id: '1', a: 1, b: 2, c: 3 },
  { _id: '2', a: 2, b: 2, c: 4 },
  { _id: '3', a: 3, b: 4, c: 5 },
];
describe('local-mongo-model', () => {
  const Model = new LocalMongoModel('test');
  beforeAll(async () => {
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
    console.log('doc2', doc2.toJSON())
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
});
