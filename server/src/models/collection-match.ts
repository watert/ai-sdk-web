/**
 * mongodb style object query match
 * https://docs.mongodb.com/manual/reference/operator/query/
 *
 * - [x] basic comparison: $eq, $gt, $gte, $in, $lt, $lte, $ne, $nin
 * - [x] element: $type, $exists
 * - [x] array: $all, $elemMatch, $size
 * - [x] logical: $and, $or, $not
 * - [x] evaluation: $regex
 * - [ ] evaluation: $expr
 *    - [x] comparison
 *    - [x] math exprs
 *    - [ ] arr $ne
 *    - [ ] arr expr
 *  - [ ] bitwise expr
 */

const reLeadingDot = /^\./;
const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reEscapeChar = /\\(\\)?/g;

export const isTruthy = (val) => val && !['false', '0', ''].includes(val.toString().trim().toLowerCase());

export function stringToPath(string) {
  const result: any[] = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, (match, number, quote, string) => {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

export function toPath(path) {
  return typeof path === 'string' ? stringToPath(path) : [].concat(path);
}

export function _get(obj, path) {
  return toPath(path).reduce((memo, key) => {
    if (!memo) return key ? undefined : memo;
    return memo[key];
  }, obj);
}

// import getType from './getType';
export function execExpr(state, exp) {
  if (getType(exp) === 'plainobject') {
    return Object.entries(exp).reduce((memo, [op, args]: any) => {
      args = args.map(r => execExpr(state, r));
      if (op === '$add') {
        return args[0] + args[1];
      }
      if (op === '$divide') return args[0] - args[1];
      if (op === '$cmp') {
        if (args[0] > args[1]) return 1;
        if (args[1] > args[0]) return -1;
        return 0;
      }
      if (['pow', 'sqrt', 'ceil', 'floor', 'abs'].includes(op.slice(1))) {
        return Math[op.slice(1)](...args);
      }
      return memo;
    }, state);
  }
  if (typeof exp === 'string' && exp.slice(0, 1) === '$') {
    exp = _get(state, exp.slice(1));
  }
  return exp;
}


export function getType(val) {
  const type = typeof val;
  if (type === 'object') {
    if (Array.isArray(val)) return 'array';
    if (val.constructor === Date) return 'date';
    if (val.constructor === RegExp) return 'regex';
    if (val === null) return 'null';
    return 'plainobject';
  }
  if (type === 'number') {
    if (parseInt(val) === val) return 'int';
  }
  return type;
}


export const operators = {
  // comparison
  $eq: (src, val) => src === val,
  $ne: (src, val) => {
    // console.log('called $ne', src, val);
    return src !== val;
  },
  $gt: (src, val) => src > val,
  $gte: (src, val) => src >= val,
  $lt: (src, val) => src < val,
  $lte: (src, val) => src <= val,
  $in: (src, val) => {
    if (typeof val !== 'undefined' && !Array.isArray(val)) {
      val = [].concat(val);
    }
    // if (typeof val === 'object' && !Array.isArray(val)) {
    //   val = Object.values(val);
    // }
    if (!val || !val.find) return false;
    return typeof val.find((row) => {
      if (getType(row) === 'regex') return row.test(src);
      return src === row;
    }) !== 'undefined';
  },
  $nin: (src, val) => !operators.$in(src, val),

  // element
  $type: (src, val) => typeof src === val || getType(src) === val,
  $exists: (src, val) => {
    const exists = typeof src !== 'undefined';
    return isTruthy(val) ? exists : !exists;
  },

  // array
  $elemMatch: (src, val) => match(src, val),
  $all: (src, val) => {
    if (Array.isArray(val)) {
      return !val.find(row => !match(src, row));
    }
    return !src.find(row => !match(row, val));
  },
  $size: (src, val) => {
    return match(src, val)
    return src.length === val;
  },

  // expression
  $regex: (src, val) => {
    // console.log('$regex', src, val);
    if (typeof val === 'string') val = new RegExp(val);
    return val.test(src);
  },
  $expr: (src, val) => Object.entries(val).reduce((memo, [op, args]: any) => {
    const [src2, val] = args.map(exp => execExpr(memo, exp));
    return match(src2, { [op]: val });
  }, src),

  // logical
  $and: (src, val) => !val.find(query => !match(src, query)),
  $or: (src, val) => typeof val.find(query => match(src, query)) !== 'undefined',
  $not: (src, val) => {
    if (Array.isArray(val)) return !val.find(query => match(src, query));
    return !match(src, val)
  },
};

export function match(src, value, extendOps = {}) {
  // console.log('call match', [src, value, extendOps]);
  if (src === value) return true;
  if (Array.isArray(src) && Array.isArray(value)) { // array to array compare
    if (value.length !== src.length) return false;
    return value.reduce(((memo, row, idx) => memo && match(row, src[idx], extendOps)), true);
  }

  // simple array match
  if (Array.isArray(src) && typeof value !== 'object') { // array match any
    return typeof src.find(row => match(row, value, extendOps)) !== 'undefined';
  }

  // query object match
  if (value.constructor === RegExp) {
    value = { $regex: value };
  }
  if (typeof value === 'object' && !Object.keys(value).length) {
    return true;
  }
  if (typeof value === 'object' && Object.keys(value).length) { // elemMatch
    return Object.entries(value).reduce((memo, [op, val]: any) => {
      if (memo === false) return memo;
      
      if (Array.isArray(src) && op === '$ne') {
        return !src?.includes(value[op]);
      }
      if (Array.isArray(src) && op === '$size') {
        return match(src.length, value[op], extendOps);
      }
      if (Array.isArray(src) && !['$all', '$size', '$elemMatch'].includes(op)) {
        return !!src.find(row => match(row, value, extendOps));
      }

      const operatorFn = extendOps[op] || operators[op];
      if (operatorFn) {
        // console.log('operatorFn', {src, value, val, operatorFn});
        return operatorFn(src, val, extendOps);
      }

      if (op.slice(0, 1) === '$') {
        throw new Error(`Operation ${op} Not Exists.`);
      }
      if (typeof val === 'object') {
        if (val.constructor === RegExp) {
          const srcVal = _get(src, op);
          if (typeof srcVal === 'string') return val.test(srcVal);
          if (Array.isArray(srcVal)) {
            return !!srcVal.find(row => val?.test?.(row));
          }
          return false;
        }
        return match(_get(src, op), val, extendOps);
      }

      return match(_get(src, op), { $eq: val }, extendOps);
    }, true);
  }
  return false;
}

const collectionMatch = match;


export { collectionMatch };
export default collectionMatch;