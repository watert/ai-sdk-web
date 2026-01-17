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
  it.only('should fix partial arr string in obj v2', () => {
    const text = '{\n  "mbti": "ENFP",\n  "tags": [\n    "种草达人",\n    "生活美学家",\n    "故事讲述者",\n    "潮流先锋"\n  ],\n  "industryIds": [\n    "food",\n    "travel",\n    "beauty-personal-care",\n    "culture';
    expect(fixJson(text)).toBe(text + '"]}');
    expect(JSON.parse(fixJson(text))).toEqual({
      mbti: 'ENFP',
      tags: ['种草达人', '生活美学家', '故事讲述者', '潮流先锋'],
      industryIds: ['food', 'travel', 'beauty-personal-care', 'culture'],
    });
  });
})