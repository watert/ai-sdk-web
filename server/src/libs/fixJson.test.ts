import { fixJson } from "./fixJson";

describe('fixJson', () => {
  it('should fix json string', () => {
    const text = '{"a": 1, "b": 2, "c';
    expect(fixJson(text)).toBe('{"a": 1, "b": 2}');
    expect(JSON.parse(fixJson(text))).toEqual({a: 1, b: 2 });
  });
  it('should fix partial json string', () => {
    const text = '{"a": 1, "b": 2, "c": "foo';
    expect(fixJson(text)).toBe(text + '"}');
    expect(JSON.parse(fixJson(text))).toEqual({a: 1, b: 2, c: 'foo'});
  });
  it('should fix partial arr string', () => {
    const text = '["foo", "bar';
    expect(fixJson(text)).toBe(text + '"]');
    expect(JSON.parse(fixJson(text))).toEqual(['foo', 'bar']);
  });
  it('should fix partial arr string in obj', () => {
    const text = '{ "a": ["foo", "bar';
    expect(fixJson(text)).toBe(text + '"]}');
    expect(JSON.parse(fixJson(text))).toEqual({a: ['foo', 'bar']});
  });
})