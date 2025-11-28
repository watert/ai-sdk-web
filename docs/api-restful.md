# RESTful API 文档

## 概述

本项目提供了一个符合 RESTful 协议的 API 接口，用于访问和操作数据库中的数据。API 路径格式为 `api/db/ext_data/:collection`，其中 `:collection` 是具体的数据集合名称。

## 响应格式

所有 API 响应均为 JSON 格式，包含以下基本结构：

```json
{
  "data": any,       // 返回的数据内容
  "total"?: number    // 仅在查询列表时返回，表示总数据条数
}
```

## API 列表

### 1. 查询数据（GET）

通过 querystring 检索内容，支持 MongoDB 的 Find 协议参数。

#### 请求
```
GET api/db/ext_data/:collection?<query_params>
```

#### 参数
- **query_params**: 支持 MongoDB 的 Find 协议参数，如 `name=John&age=25`
- **$limit**: 控制返回结果数量（分页大小）
- **$skip**: 控制跳过的结果数量（分页偏移）
- **$select**: 控制返回字段（projection），如 `$select=name,age`
- **$sort**: 控制排序，如 `$sort=createdAt:-1`（按 createdAt 降序）

#### 响应
```json
{
  "data": [/* 查询结果数组 */],
  "total": 100        // 总数据条数
}
```

### 2. 创建数据（POST）

创建一个新的文档项。

#### 请求
```
POST api/db/ext_data/:collection
Content-Type: application/json

{/* 文档内容 */}
```

#### 响应
```json
{
  "data": {/* 创建的文档 */}
}
```

### 3. 获取单条数据（GET）

根据 `_id` 获取单条数据。

#### 请求
```
GET api/db/ext_data/:collection/:_id
```

#### 响应
```json
{
  "data": {/* 文档内容 */}
}
```

### 4. 删除数据（DELETE）

根据 `_id` 删除单条数据。

#### 请求
```
DELETE api/db/ext_data/:collection/:_id
```

#### 响应
```json
{
  "data": {/* 删除的文档 */}
}
```

### 5. 修改数据（PUT）

根据 `_id` 修改数据，支持 MongoDB 的 `$set` 操作。

#### 请求
```
PUT api/db/ext_data/:collection/:_id
Content-Type: application/json

{/* 修改内容，支持 $set 操作 */}
```

#### 示例
```json
{
  "$set": {
    "name": "New Name",
    "age": 30
  }
}
```

#### 响应
```json
{
  "data": {/* 修改后的文档 */}
}
```

### 6. 高级查询（POST）

通过请求体进行更复杂的查询，支持 MongoDB 的 Find 协议。

#### 请求
```
POST api/db/ext_data/:collection/query
Content-Type: application/json

{
  "filter": {/* MongoDB 查询条件 */},
  "$limit": 10,
  "$skip": 0,
  "$select": "name,age",
  "$sort": { "createdAt": -1 }
}
```

#### 响应
```json
{
  "data": [/* 查询结果数组 */],
  "total": 100        // 总数据条数
}
```

## 使用示例

### 查询所有用户
```
GET api/db/ext_data/users
```

### 按条件查询用户
```
GET api/db/ext_data/users?name=John&age=25
```

### 分页查询用户
```
GET api/db/ext_data/users?age[gte]=18&$limit=10&$skip=20&$sort=createdAt:-1
```

### 创建用户
```
POST api/db/ext_data/users
Content-Type: application/json

{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}
```

### 修改用户
```
PUT api/db/ext_data/users/60d5ec49f1e7a1001f8e4b23
Content-Type: application/json

{
  "$set": {
    "age": 31,
    "email": "john.doe@example.com"
  }
}
```

### 高级查询
```
POST api/db/ext_data/users/query
Content-Type: application/json

{
  "filter": {
    "age": { "$gte": 18, "$lte": 30 },
    "city": "Beijing"
  },
  "$select": "name,age,email",
  "$sort": { "createdAt": -1 },
  "$limit": 20,
  "$skip": 0
}
```

## MongoDB Find 协议支持

本 API 支持 MongoDB 的 Find 协议，包括但不限于：

- 基本查询：`{ "name": "John" }`
- 比较查询：`{ "age": { "$gte": 18 } }`
- 逻辑查询：`{ "$and": [{ "age": { "$gte": 18 } }, { "city": "Beijing" }] }`
- 数组查询：`{ "tags": "developer" }`
- 正则查询：`{ "name": { "$regex": "^J" } }`

更多 MongoDB Find 协议细节请参考 [MongoDB 官方文档](https://docs.mongodb.com/manual/reference/method/db.collection.find/)。