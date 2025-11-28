/**
 * 路径访问工具：用于通过路径访问对象的 get/set 工具函数
 * 
 * @example
 * // 获取对象路径值
 * _get({ b: [0, { c: 'CCC' }] }, 'b[1].c'); // 返回 'CCC'
 * 
 * // 设置对象路径值
 * _set({ a: 0 }, 'b.c', 1); // 返回 { a: 0, b: { c: 1 } }
 * 
 * // 使用自定义函数设置值
 * _set({ a: 0 }, 'b.c', 2, (v) => v * 10); // 返回 { a: 0, b: { c: 20 } }
 * 
 * // 设置数组索引
 * _set({ a: 0 }, 'b[1]', 1); // 返回 { a: 0, b: [undefined, 1] }
 */

const reLeadingDot = /^\./;
const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reEscapeChar = /\\(\\)?/g;

/**
 * 将字符串路径转换为路径数组
 * @param {string} string - 字符串路径，例如 'a.b[0].c'
 * @returns {Array<string|number>} 路径数组，例如 ['a', 'b', '0', 'c']
 */
export function stringToPath(string: string): Array<string | number> {
  const result: Array<string | number> = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, (match, number, quote, stringValue) => {
    const value = quote ? stringValue.replace(reEscapeChar, '$1') : (number || match);
    // 尝试转换为数字索引
    const numValue = parseInt(value, 10);
    result.push(isNaN(numValue) ? value : numValue);
    return match;
  });
  return result;
}

/**
 * 将路径转换为路径数组
 * @param {string|Array<string|number>} path - 字符串路径或路径数组
 * @returns {Array<string|number>} 标准化后的路径数组
 */
function toPath(path: string | Array<string | number>): Array<string | number> {
  return typeof path === 'string' ? stringToPath(path) : [...path];
}

/**
 * 检查值是否为正整数
 * @param {any} n - 要检查的值
 * @returns {boolean} 是否为正整数
 */
const isPositiveInteger = (n: any): boolean => n >>> 0 === parseFloat(n);

/**
 * 内部 set 函数，递归更新对象路径值
 * @template T
 * @param {T} obj - 要更新的对象
 * @param {Array<string|number>} pathArr - 路径数组
 * @param {any|((value: any) => any)} value - 要设置的值或更新函数
 * @param {(next: any, key: string|number, prev: any) => any} customizer - 自定义处理函数
 * @returns {T} 更新后的新对象
 */
function __set<T extends object>(
  obj: T,
  pathArr: Array<string | number>,
  value: any | ((value: any) => any),
  customizer: (next: any, key: string | number, prev: any) => any = (v) => v
): T {
  if (pathArr.length === 0) {
    return typeof value === 'function' ? (value as Function)(obj) : (value as T);
  }
  
  const firstKey = pathArr[0];
  // 如果当前对象不是对象类型，根据键类型创建新对象或数组
  if (typeof obj !== 'object' || obj === null) {
    obj = (isPositiveInteger(firstKey) ? [] : {}) as T;
  }
  
  // 递归更新子路径
  const val = __set(obj[firstKey as keyof T] as any, pathArr.slice(1), value, customizer);
  
  let next: any;
  if (Array.isArray(obj)) {
    // 数组处理：创建新数组并设置值
    next = [...obj] as any[];
    next[firstKey as number] = val;
  } else {
    // 对象处理：创建新对象并设置值
    next = { ...obj, [firstKey]: val };
  }
  
  // 如果是最后一个路径段，应用自定义处理函数
  if (pathArr.length === 1) {
    return customizer(next, firstKey, obj) as T;
  }
  
  return next as T;
}

/**
 * 获取对象指定路径的值
 * @template T, D
 * @param {T} obj - 要访问的对象
 * @param {string|Array<string|number>|((obj: T) => any)} path - 路径字符串、路径数组或访问函数
 * @param {D} [defaultValue] - 默认值，当路径不存在时返回
 * @returns {any|D} 路径对应的值或默认值
 */
export function _get<T extends object, D = undefined>(
  obj: T,
  path: string | Array<string | number> | ((obj: T) => any),
  defaultValue?: D
): any | D {
  if (typeof path === 'function') {
    return path(obj);
  }
  
  const res = toPath(path).reduce((memo: any, key: string | number) => {
    if (!memo && key) return undefined;
    return memo[key];
  }, obj);
  
  return res === undefined ? defaultValue : res;
}

/**
 * 设置对象指定路径的值，返回新对象
 * @template T
 * @param {T} obj - 要更新的对象
 * @param {string|Array<string|number>} path - 路径字符串或路径数组
 * @param {any|((value: any) => any)} value - 要设置的值或更新函数
 * @param {(next: any, key: string|number, prev: any) => any} [customizer] - 自定义处理函数
 * @returns {T} 更新后的新对象
 */
export function _set<T extends object>(
  obj: T,
  path: string | Array<string | number>,
  value: any | ((value: any) => any),
  customizer?: (next: any, key: string | number, prev: any) => any
): T {
  return __set(obj, toPath(path), value, customizer);
}
