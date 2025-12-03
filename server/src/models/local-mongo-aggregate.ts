import _ from 'lodash';
import { collectionMatch } from './collection-match';

// 定义聚合管道阶段类型
type AggregateStage = {
  $match?: any;
  $project?: any;
  $sort?: any;
  $limit?: number;
  $skip?: number;
  $group?: any;
  $unwind?: string;
  $addFields?: any;
  $replaceRoot?: any;
  $lookup?: any;
};

/**
 * MongoDB 聚合查询兼容实现
 * @param jsonDocs 输入的纯对象数组
 * @param pipelines 聚合管道
 * @returns 处理后的结果
 */
export function mongoAggregate(jsonDocs: any[], pipelines: AggregateStage[]): any {
  let result = [...jsonDocs];

  // 遍历聚合管道的每个阶段
  for (const stage of pipelines) {
    if (stage.$match) {
      result = handleMatch(result, stage.$match);
    } else if (stage.$project) {
      result = handleProject(result, stage.$project);
    } else if (stage.$sort) {
      result = handleSort(result, stage.$sort);
    } else if (stage.$limit) {
      result = handleLimit(result, stage.$limit);
    } else if (stage.$skip) {
      result = handleSkip(result, stage.$skip);
    } else if (stage.$group) {
      result = handleGroup(result, stage.$group);
    } else if (stage.$unwind) {
      result = handleUnwind(result, stage.$unwind);
    } else if (stage.$addFields) {
      result = handleAddFields(result, stage.$addFields);
    } else if (stage.$replaceRoot) {
      result = handleReplaceRoot(result, stage.$replaceRoot);
    } else if (stage.$lookup) {
      result = handleLookup(result, stage.$lookup);
    } else {
      console.warn('no stage action found??', stage);
    }
  }

  return result;
}

/**
 * 处理 $match 阶段
 */
function handleMatch(docs: any[], filter: any): any[] {
  return docs.filter(doc => collectionMatch(doc, filter));
}

/**
 * 处理 $project 阶段
 */
function handleProject(docs: any[], projection: any): any[] {
  return docs.map(doc => {
    // 检查是否包含排除字段（值为0的字段）
    const hasExcludeFields = Object.values(projection).includes(0);
    
    if (hasExcludeFields) {
      // 使用 _.omitBy 排除指定字段
      const fieldsToOmit = _.pickBy(projection, value => value === 0);
      const newDoc = _.omitBy(doc, (value, key) => key in fieldsToOmit);
      // 默认保留 _id 字段，除非明确排除
      if (!('_id' in fieldsToOmit)) {
        newDoc._id = doc._id;
      }
      return newDoc;
    } else {
      // 使用 _.pickBy 选择包含字段
      const fieldsToInclude = _.pickBy(projection, value => value !== 0);
      const newDoc: any = {};
      
      // 处理每个包含的字段
      for (const [key, value] of Object.entries(fieldsToInclude)) {
        if (key === '_id') {
          // 特殊处理 _id 字段
          newDoc._id = doc._id;
        } else if (typeof value === 'object' && value !== null) {
          // 处理嵌套投影或计算字段
          newDoc[key] = evaluateExpression(doc, value);
        } else {
          // 直接选择字段
          newDoc[key] = _.get(doc, key);
        }
      }
      
      return newDoc;
    }
  });
}

/**
 * 处理 $sort 阶段
 */
function handleSort(docs: any[], sort: any): any[] {
  // 对每个排序字段应用排序
  let sortedDocs = [...docs];
  
  // MongoDB 排序支持多字段排序，按顺序应用
  for (const [key, direction] of Object.entries(sort)) {
    sortedDocs.sort((a, b) => {
      const aVal = _.get(a, key);
      const bVal = _.get(b, key);
      
      if (aVal < bVal) return direction === 1 ? -1 : 1;
      if (aVal > bVal) return direction === 1 ? 1 : -1;
      return 0;
    });
  }
  
  return sortedDocs;
}

/**
 * 处理 $limit 阶段
 */
function handleLimit(docs: any[], limit: number): any[] {
  return docs.slice(0, limit);
}

/**
 * 处理 $skip 阶段
 */
function handleSkip(docs: any[], skip: number): any[] {
  return docs.slice(skip);
}

/**
 * 处理 $group 阶段
 */
function handleGroup(docs: any[], group: any): any[] {
  const { _id, ...accumulators } = group;
  
  return _.chain(docs)
    .groupBy((doc) => evaluateExpression(doc, _id))
    .map((groupDocs, key) => {
      const groupResult: any = {
        _id: key === 'undefined' ? undefined : key
      };
      
      // 处理累加器
      for (const [field, expr] of Object.entries(accumulators)) {
        groupResult[field] = evaluateAccumulator(groupDocs, expr);
      }
      
      return groupResult;
    })
    .value();
}

/**
 * 处理 $unwind 阶段
 */
function handleUnwind(docs: any[], fieldPath: string): any[] {
  // 移除字段路径中的 $ 符号
  const actualFieldPath = fieldPath.startsWith('$') ? fieldPath.slice(1) : fieldPath;
  
  return _.flatMap(docs, (doc) => {
    const value = _.get(doc, actualFieldPath);
    
    if (!Array.isArray(value)) {
      return [doc];
    }
    
    if (value.length === 0) {
      return [];
    }
    
    return value.map((item: any) => {
      const newDoc = _.cloneDeep(doc);
      _.set(newDoc, actualFieldPath, item);
      return newDoc;
    });
  });
}

/**
 * 处理 $addFields 阶段
 */
function handleAddFields(docs: any[], fields: any): any[] {
  return docs.map(doc => {
    const newDoc = _.cloneDeep(doc);
    
    for (const [field, expr] of Object.entries(fields)) {
      // 直接评估表达式，不做额外检查
      const value = evaluateExpression(doc, expr);
      _.set(newDoc, field, value);
    }
    
    return newDoc;
  });
}

/**
 * 处理 $replaceRoot 阶段
 */
function handleReplaceRoot(docs: any[], replaceRoot: any): any[] {
  if (replaceRoot.$newRoot) {
    return docs.map(doc => evaluateExpression(doc, replaceRoot.$newRoot));
  }
  
  return docs;
}

/**
 * 处理 $lookup 阶段（简化实现）
 */
function handleLookup(docs: any[], lookup: any): any[] {
  const { from, localField, foreignField, as } = lookup;
  
  // 这里假设 from 是另一个文档数组，实际应用中可能需要从其他地方获取
  // 为了简化实现，我们暂时不处理 from 参数，只返回原始文档
  console.warn('$lookup is not fully implemented, returning original documents');
  return docs;
}

/**
 * 评估表达式
 */
function evaluateExpression(doc: any, expr: any): any {
  // 字符串类型的字段路径（如 '$salary'）
  if (typeof expr === 'string' && expr.startsWith('$')) {
    return _.get(doc, expr.slice(1));
  }
  
  // 其他基本类型直接返回
  if (typeof expr !== 'object' || expr === null) {
    return expr;
  }
  
  // 数组类型，评估每个元素
  if (Array.isArray(expr)) {
    return expr.map(item => evaluateExpression(doc, item));
  }
  
  const keys = Object.keys(expr);
  
  // 处理单个字段路径（如 { $salary: 1 }）
  if (keys.length === 1) {
    const key = keys[0];
    if (key.startsWith('$') && expr[key] === 1) {
      // 直接字段路径，如 { $salary: 1 }
      return _.get(doc, key.slice(1));
    } else if (!key.startsWith('$') && expr[key] === 1) {
      // 投影字段，如 { salary: 1 }
      return _.get(doc, key);
    }
    // 如果是单个操作符（如 { $multiply: [...] }），不处理，继续到下一个循环
  }
  
  // 处理表达式操作符
  for (const [op, value] of Object.entries(expr)) {
    if (op.startsWith('$')) {
      const typedValue = value as any;
      switch (op) {
        case '$add':
          return typedValue.reduce((sum: number, item: any) => sum + evaluateExpression(doc, item), 0);
        
        case '$subtract':
          if (typedValue.length !== 2) return 0;
          return evaluateExpression(doc, typedValue[0]) - evaluateExpression(doc, typedValue[1]);
        
        case '$multiply':
          return typedValue.reduce((product: number, item: any) => product * evaluateExpression(doc, item), 1);
        
        case '$divide':
          if (typedValue.length !== 2) return 0;
          const dividend = evaluateExpression(doc, typedValue[0]);
          const divisor = evaluateExpression(doc, typedValue[1]);
          return divisor !== 0 ? dividend / divisor : 0;
        
        case '$concat':
          return typedValue.map((item: any) => evaluateExpression(doc, item)).join('');
        
        case '$eq':
          if (typedValue.length !== 2) return false;
          return evaluateExpression(doc, typedValue[0]) === evaluateExpression(doc, typedValue[1]);
        
        case '$ne':
          if (typedValue.length !== 2) return true;
          return evaluateExpression(doc, typedValue[0]) !== evaluateExpression(doc, typedValue[1]);
        
        case '$gt':
          if (typedValue.length !== 2) return false;
          return evaluateExpression(doc, typedValue[0]) > evaluateExpression(doc, typedValue[1]);
        
        case '$gte':
          if (typedValue.length !== 2) return false;
          return evaluateExpression(doc, typedValue[0]) >= evaluateExpression(doc, typedValue[1]);
        
        case '$lt':
          if (typedValue.length !== 2) return false;
          return evaluateExpression(doc, typedValue[0]) < evaluateExpression(doc, typedValue[1]);
        
        case '$lte':
          if (typedValue.length !== 2) return false;
          return evaluateExpression(doc, typedValue[0]) <= evaluateExpression(doc, typedValue[1]);
        
        case '$and':
          return typedValue.every((cond: any) => evaluateExpression(doc, cond));
        
        case '$or':
          return typedValue.some((cond: any) => evaluateExpression(doc, cond));
        
        case '$not':
          return !evaluateExpression(doc, typedValue);
        
        case '$ifNull':
          if (typedValue.length !== 2) return undefined;
          const val = evaluateExpression(doc, typedValue[0]);
          return val !== undefined ? val : evaluateExpression(doc, typedValue[1]);
        
        default:
          // 如果是未知操作符，尝试作为嵌套表达式处理
          return evaluateExpression(doc, typedValue);
      }
    }
  }
  
  // 如果没有找到匹配的操作符，尝试处理嵌套表达式
  // 例如 { bonus: { $multiply: ['$salary', 0.1] } }
  const nestedKeys = Object.keys(expr);
  if (nestedKeys.length === 1) {
    const key = nestedKeys[0];
    return evaluateExpression(doc, expr[key]);
  }
  
  // 默认返回 undefined
  return undefined;
}

/**
 * 评估累加器
 */
function evaluateAccumulator(docs: any[], expr: any): any {
  if (typeof expr !== 'object' || expr === null) {
    return expr;
  }
  
  for (const [op, value] of Object.entries(expr)) {
    switch (op) {
      case '$sum':
        if (value === 1) {
          return docs.length;
        }
        return _.sum(docs.map(doc => evaluateExpression(doc, value)));
      case '$avg':
        const values = docs.map(doc => evaluateExpression(doc, value));
        return _.mean(values);
      case '$min':
        return _.min(docs.map(doc => evaluateExpression(doc, value)));
      case '$max':
        return _.max(docs.map(doc => evaluateExpression(doc, value)));
      case '$first':
        return evaluateExpression(docs[0], value);
      case '$last':
        return evaluateExpression(docs[docs.length - 1], value);
      case '$push':
        return docs.map(doc => evaluateExpression(doc, value));
      case '$addToSet':
        return _.uniq(docs.map(doc => evaluateExpression(doc, value)));
      default:
        return expr;
    }
  }
  
  return expr;
}
