/**
// 一个基于 lodash 兼容 mongodb update operation 的函数, 比如 update 可以是 { $set, $unset, $push, $pull, $inc, $mul, $min, $max, $currentDate, $addToSet, $pop, $pullAll, $bit, $rename, $setOnInsert, $[key: string]: any }
export function updateItem(json, update: object): object { // TODO: object[] treat as update pipeline
  if (Array.isArray(json)) throw new Error('updateItem not support array');
  if (Array.isArray(update)) { throw new Error('updateItem not support array pipeline yet'); }
  // TODO
  return { ...json };
}
补充完善这个函数
* 尽可能使用 ES6 / lodash 中有的方法来简化, 比如 deepClone, _.isMatch, _.isEqual, _.get, _.set, _.toPath 等
* 如果有 helper 函数也可以抽离出来作为单独的 pure function
 */


import _ from 'lodash';
export function mongoUpdateItem(json: object, update: any): object {
  if (Array.isArray(json)) throw new Error('updateItem not support array');
  if (Array.isArray(update)) { throw new Error('updateItem not support array pipeline yet'); }

  // 1. 深拷贝原对象, 保证 immutability, 以及处理纯 object 传入
  const dest = _.cloneDeep(json);
  const hasOperator = Object.keys(update).some(key => key.startsWith('$'));
  if (!hasOperator) { update = { $set: update } }

  // 2. 遍历 update 对象中的所有 operator keys (如 $set, $push)
  Object.keys(update).forEach((operator) => {
    const fields = update[operator]; // 这里的 fields 通常是 { "path.to.key": value }
    
    switch (operator) {
    case '$set':
      handleSet(dest, fields);
      break;
    case '$unset':
      handleUnset(dest, fields);
      break;
    case '$inc':
      handleMath(dest, fields, (a, b) => (a || 0) + b);
      break;
    case '$mul':
      handleMath(dest, fields, (a, b) => (a === undefined ? 0 : a) * b);
      break;
    case '$min':
      handleMath(dest, fields, (current, target) => 
        (current === undefined || target < current) ? target : current
      );
      break;
    case '$max':
      handleMath(dest, fields, (current, target) => 
        (current === undefined || target > current) ? target : current
      );
      break;
    case '$rename':
      handleRename(dest, fields);
      break;
    case '$currentDate':
      handleCurrentDate(dest, fields);
      break;
    case '$push':
      handlePush(dest, fields);
      break;
    case '$addToSet':
      handleAddToSet(dest, fields);
      break;
    case '$pop':
      handlePop(dest, fields);
      break;
    case '$pull':
      handlePull(dest, fields);
      break;
    case '$pullAll':
      handlePullAll(dest, fields);
      break;
    case '$bit':
      handleBit(dest, fields);
      break;
    case '$setOnInsert':
      // 这是一个 update 操作, 且假定 json 已存在, 所以 $setOnInsert 不做任何事
      break;
    default:
      // 如果 key 不以 $ 开头, 这可能是一个 Replacement update, 但在本函数语境下
      // 我们通常只处理 Operator update。如果为了严谨, 可以抛出错误或忽略。
      // 此处选择忽略不认识的操作符
      console.warn(`Unknown update operator: ${operator}`);
      break;
    }
  });

  return dest;
}

// --- Helper Functions ---

function handleSet(doc: object, fields: object) {
  _.forEach(fields, (value, path) => {
    _.set(doc, path, value);
  });
}

function handleUnset(doc: object, fields: object) {
  _.forEach(fields, (_v, path) => {
    _.unset(doc, path);
  });
}

function handleRename(doc: object, fields: object) {
  _.forEach(fields, (newPath, oldPath) => {
    const value = _.get(doc, oldPath);
    // 只有当旧路径存在值时才进行重命名
    if (value !== undefined) {
      _.unset(doc, oldPath);
      _.set(doc, newPath, value);
    }
  });
}

/**
 * 处理 $inc, $mul, $min, $max 等数学/比较运算
 * @param operation - (currentValue, updateValue) => newValue
 */
function handleMath(doc: object, fields: object, operation: (curr: any, val: any) => any) {
  _.forEach(fields, (value, path) => {
    const current = _.get(doc, path);
    const newValue = operation(current, value);
    _.set(doc, path, newValue);
  });
}

function handleCurrentDate(doc: object, fields: object) {
  const now = new Date();
  _.forEach(fields, (_typeSpec, path) => {
    // MongoDB 支持 { $type: "timestamp" } 或 { $type: "date" } 或 true
    // 这里简化处理, 统一设为 JS Date 对象, 除非明确模拟 Timestamp
    _.set(doc, path, now);
  });
}

function handlePush(doc: object, fields: object) {
  _.forEach(fields, (value, path) => {
    // 获取当前数组, 如果不存在初始化为空数组
    const arr = _.get(doc, path, []);
    if (!Array.isArray(arr)) throw new Error(`Cannot apply $push to non-array field: ${path}`);

    // 检查是否有 $each, $slice, $position 等修饰符
    // 简化实现：只处理基本 push 和 $each
    if (_.isPlainObject(value) && value['$each']) {
      // 简单的 $each 支持
      const itemsToPush = Array.isArray(value['$each']) ? value['$each'] : [value['$each']];
      // MongoDB 实际上在这里还支持 $position, $sort, $slice
      // 这里简单实现 append
      arr.push(...itemsToPush);
    } else {
      arr.push(value);
    }
    
    _.set(doc, path, arr);
  });
}

function handleAddToSet(doc: object, fields: object) {
  _.forEach(fields, (value, path) => {
    const arr: any[] = _.get(doc, path, []);
    if (!Array.isArray(arr)) throw new Error(`Cannot apply $addToSet to non-array field: ${path}`);

    const itemsToAdd = (_.isPlainObject(value) && value['$each']) 
      ? value['$each'] 
      : [value];

    itemsToAdd.forEach((item: any) => {
      // 使用 lodash 的 isEqual 做深度比较, 避免对象引用不同导致的重复
      const exists = _.some(arr, (existing) => _.isEqual(existing, item));
      if (!exists) {
        arr.push(item);
      }
    });

    _.set(doc, path, arr);
  });
}

function handlePop(doc: object, fields: object) {
  _.forEach(fields, (direction, path) => {
    const arr = _.get(doc, path);
    if (Array.isArray(arr)) {
      if (direction === 1) {
        arr.pop(); // 移除最后一个
      } else if (direction === -1) {
        arr.shift(); // 移除第一个
      }
      // 此时 arr 是引用修改, 无需重新 set, 但为了保险（若 arr 是新建的）
      // 在这里不需要操作, 因为 get 获取的是对象内部引用
    }
  });
}

function handlePullAll(doc: object, fields: object) {
  _.forEach(fields, (valuesToRemove, path) => {
    const arr = _.get(doc, path);
    if (Array.isArray(arr) && Array.isArray(valuesToRemove)) {
      // 使用 pullAllWith + isEqual 处理对象数组的移除
      _.pullAllWith(arr, valuesToRemove, _.isEqual);
    }
  });
}

function handlePull(doc: object, fields: object) {
  _.forEach(fields, (condition, path) => {
    const arr = _.get(doc, path);
    if (Array.isArray(arr)) {
      // MongoDB 的 $pull 非常强大, 支持 Query Selector。
      // 这里我们模拟两种情况：
      // 1. 直接值匹配 (Primitive 或 Exact Object match)
      // 2. 简单的对象属性匹配 (类似 Query)
      
      _.remove(arr, (item) => {
        // 如果 condition 是基本类型, 做全等比较
        if (!_.isObject(condition)) {
          return item === condition;
        }
        // 如果 condition 是对象, MongoDB 语义通常是：
        // - 如果 item 是对象, 且 condition 是 Query (如 { a: {$gt: 1} }) -> 复杂
        // - 简化版：使用 lodash 的 isMatch 来模拟 "subset match" (符合 condition 的所有属性)
        //   或者 isEqual 完全匹配。
        //   MongoDB 标准 $pull: { a: 1 } 会移除 { a: 1, b: 2 } 吗？
        //   答案：如果是 { field: { a: 1 } }, 它会匹配 item 包含 {a:1} 的情况。
        
        // 策略：使用 isMatch (包含匹配) 比较接近大多数简单查询场景
        return _.isEqual(item, condition) || (_.isObject(item) && _.isMatch(item, condition));
      });
    }
  });
}

function handleBit(doc: object, fields: object) {
  _.forEach(fields, (ops: any, path) => {
    const current = _.get(doc, path, 0);
    let newValue = current;
    
    if (ops.and) newValue = newValue & ops.and;
    if (ops.or)  newValue = newValue | ops.or;
    if (ops.xor) newValue = newValue ^ ops.xor;
    
    _.set(doc, path, newValue);
  });
}