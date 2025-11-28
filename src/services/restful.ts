import { appAxios } from '../models/appAxios';
import qs from 'qs';

/**
 * RESTful Service
 * 用于与RESTful API交互的服务类，支持MongoDB Find协议查询
 * 
 * Usage:
 * ```typescript
 * // 1. 创建服务实例
 * const userService = new RestfulService<User>('users');
 * 
 * // 2. 查询数据
 * const users = await userService.find({ age: { $gte: 18 }, $limit: 10 });
 * 
 * // 3. 创建数据
 * const newUser = await userService.create({ name: 'John', age: 30 });
 * 
 * // 4. 获取单条数据
 * const user = await userService.getById('123');
 * 
 * // 5. 更新数据
 * await userService.update('123', { $set: { age: 31 } });
 * 
 * // 6. 删除数据
 * await userService.delete('123');
 * 
 * // 7. 通过POST body查询
 * const filteredUsers = await userService.findByBody(
 *   { age: { $gte: 18 } },
 *   { $limit: 10, $sort: { createdAt: -1 } }
 * );
 * ```
 */

// 定义响应类型
export interface RestfulResponse<T> { data: T; total?: number; }

// 定义查询参数类型
export interface QueryParams {
  $limit?: number; $skip?: number; $select?: string;
  $sort?: string | Record<string, 1 | -1>;
  [key: string]: any;
}

// 传统Promise风格的RESTful服务类
export class RestfulService<T> {
  private collection: string;
  private baseUrl: string;

  constructor(collection: string, baseUrl: string = '/db/ext_data') {
    this.collection = collection;
    this.baseUrl = baseUrl;
  }

  /**
   * 构建请求URL
   * @param id 可选的文档ID
   * @param endpoint 可选的端点路径
   * @returns 完整的请求URL
   */
  protected buildUrl(id?: string, endpoint?: string): string {
    let url = `${this.baseUrl}/${this.collection}`;
    if (id) {
      url += `/${id}`;
    }
    if (endpoint) {
      url += `/${endpoint}`;
    }
    return url;
  }

  /**
   * 通过GET querystring查询数据
   * @param params 查询参数
   * @returns Promise<RestfulResponse<T[]>>
   */
  async find(params?: QueryParams): Promise<RestfulResponse<T[]>> {
    const qsOpts = { encode: true };
    const paramsSerializer = (params?: QueryParams) => qs.stringify(params, qsOpts);
    const response = await appAxios.get(this.buildUrl(), { params, paramsSerializer });
    return response.data;
  }

  /**
   * 通过POST body查询数据
   * @param query 查询条件
   * @param options 查询选项（分页、排序等）
   * @returns Promise<RestfulResponse<T[]>>
   */
  async findByBody(query: any, options?: { $limit?: number; $skip?: number; $select?: string; $sort?: any }): Promise<RestfulResponse<T[]>> {
    const response = await appAxios.post(this.buildUrl(undefined, 'query'), {
      ...query,
      ...options
    });
    
    return response.data;
  }

  /**
   * 创建新文档
   * @param data 文档数据
   * @returns Promise<RestfulResponse<T>>
   */
  async create(data: Partial<T>): Promise<RestfulResponse<T>> {
    const response = await appAxios.post(this.buildUrl(), data);
    return response.data;
  }

  /**
   * 根据ID获取单条文档
   * @param id 文档ID
   * @returns Promise<RestfulResponse<T>>
   */
  async getById(id: string): Promise<RestfulResponse<T>> {
    const response = await appAxios.get(this.buildUrl(id));
    return response.data;
  }

  /**
   * 修改文档
   * @param id 文档ID
   * @param data 修改数据，支持$set操作
   * @returns Promise<RestfulResponse<T>>
   */
  async update(id: string, data: Partial<T> | { $set: Partial<T> }): Promise<RestfulResponse<T>> {
    const response = await appAxios.put(this.buildUrl(id), data);
    return response.data;
  }

  /**
   * 删除文档
   * @param id 文档ID
   * @returns Promise<RestfulResponse<T>>
   */
  async delete(id: string): Promise<RestfulResponse<T>> {
    const response = await appAxios.delete(this.buildUrl(id));
    return response.data;
  }
}

// 示例用法：创建特定集合的服务
export const createRestfulService = <T>(collection: string) => {
  return new RestfulService<T>(collection);
};