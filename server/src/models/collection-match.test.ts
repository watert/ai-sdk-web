import { operators, match } from './collection-match';

describe('operators', () => {
  /**
   * Test $lte operator for comparison operations.
   * - Case 1: src <= val (true)
   * - Case 2: src > val (false)
   * - Case 3: src === val (true)
   */
  test('$lte', () => {
    expect(operators.$lte(5, 10)).toBe(true);
    expect(operators.$lte(15, 10)).toBe(false);
    expect(operators.$lte(10, 10)).toBe(true);
  });

  /**
   * Test $eq operator for equality comparison.
   * - Case 1: src === val (true)
   * - Case 2: src !== val (false)
   */
  test('$eq', () => {
    expect(operators.$eq(5, 5)).toBe(true);
    expect(operators.$eq(5, 10)).toBe(false);
  });

  /**
   * Test $ne operator for inequality comparison.
   * - Case 1: src !== val (true)
   * - Case 2: src === val (false)
   */
  test('$ne', () => {
    expect(operators.$ne(5, 10)).toBe(true);
    expect(operators.$ne(5, 5)).toBe(false);
  });

  /**
   * Test $in operator for checking if src is in an array.
   * - Case 1: src is in array (true)
   * - Case 2: src is not in array (false)
   * - Case 3: array contains regex (true if regex matches)
   */
  test('$in', () => {
    expect(operators.$in(5, [1, 2, 5])).toBe(true);
    expect(operators.$in(5, [1, 2, 3])).toBe(false);
    expect(operators.$in('test', [/te/, 'other'])).toBe(true);
  });
});

describe('match', () => {
  /**
   * Test match function for simple equality.
   * - Case 1: src === value (true)
   * - Case 2: src !== value (false)
   */
  test('simple equality', () => {
    expect(match(5, 5)).toBe(true);
    expect(match(5, 10)).toBe(false);
  });
  test('simple equality', () => {
    expect(match(5, 5)).toBe(true);
    expect(match({ a: 1 }, {})).toBe(true);
    expect(match(5, 10)).toBe(false);
  });

  /**
   * Test match function for array comparison.
   * - Case 1: arrays are equal (true)
   * - Case 2: arrays are not equal (false)
   */
  test('array comparison', () => {
    expect(match([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(match([1, 2, 3], [1, 2])).toBe(false);
  });

  /**
   * Test match function for regex matching.
   * - Case 1: string matches regex (true)
   * - Case 2: string does not match regex (false)
   */
  test('regex matching', () => {
    expect(match('test', /te/)).toBe(true);
    expect(match('test', /no/)).toBe(false);
  });
});