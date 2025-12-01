import _ from "lodash";

const IS_BROWSER = typeof window !== 'undefined';
const REGEXP_ISODATE = /\d{4}[\d-]{6}T[\d:.]*Z$/;
const REGEXP_REGEXP = /^\/(.*?)\/([gimy]*)$/;
const regStrParser = (str) => {
  const match = str.match(REGEXP_REGEXP);
  if (!match[1]) return str;
  const r = new RegExp(match[1], match[2]);
  r.toString = () => str;
  return r;
};
// console.log('IS_BROWSER', IS_BROWSER);
function parseIfNumber(val) {
  return (/^\d*\.?\d+$/).test(val) ? parseFloat(val) : val;
}
function isRegexpStr(val): boolean {
  return typeof val === 'string' && val.charAt(0) === '/' && REGEXP_REGEXP.test(val);
}

export function parseMongoQueryObj(v) {
  if (!_.isObject(v)) return v;
  if (Array.isArray(v)) {
    return _.map(v, parseMongoQueryObj);
    // return v;
    // return { $all: v.map(parseMongoQueryObj) };
  }
  return _.mapValues(v, (val: any, key) => {
    if (['$not'].includes(key)) return parseMongoQueryObj(val);
    if (['$or', '$and'].includes(key)) return ([] as any).concat(val).map(parseMongoQueryObj);
    if (!IS_BROWSER && typeof val === 'string' && !!val.match(REGEXP_ISODATE)) { return new Date(val); }
    if (!IS_BROWSER && isRegexpStr(val)) { return regStrParser(val); }
    if (['true', 'false'].includes(val)) { return val !== 'false'; }
    if(['$gte','$gt','$lt','$lte'].includes(key)) { return parseIfNumber(val); }
    if(["$exists"].includes(key)) { return val && val !== 'false'; }
    if (_.isObject(val)) return parseMongoQueryObj(val);

    return val;
  });
}
export const parseMongoQuery = parseMongoQueryObj;
// export function parseMongoQuery(query) {
//   query = Object.assign({}, query); // make immutable
//   ['$and', '$or'].forEach((key) => { // basic logics
//     if (query[key]) { query[key] = query[key].map(parseMongoQuery); }
//   });
//   _(query)
//     .pickBy((v, k) => k.charAt(0) !== '$')
//     // .pickBy(v => v.charAt && v.charAt(0) === '/')
//     .each((v, k) => {
//       if (!v) return v;
//       if (typeof v === 'string') { v = query[k] = parseIfNumber(v); }
//       if (['true', 'false'].includes(v)) { v = query[k] = v !== 'false'; }
//       if (!IS_BROWSER && isRegexpStr(v)) { query[k] = regStrParser(v); }
//       if (_.isObject(v)) query[k] = parseMongoQueryObj(v);
//     });

//   return query;
// }