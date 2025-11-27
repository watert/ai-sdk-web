# AI Agents 文档

本项目使用 AI SDK 实现了一个基于 React 的 AI 聊天应用，支持与不同平台的 AI 模型进行流式交互。

## 1. 代理概述

当前应用通过 `DefaultChatTransport` 实现了与 AI 服务的通信，支持以下特性：

- 流式聊天响应
- 多平台支持（当前配置为 GEMINI）
- 自定义模型配置
- 模拟数据支持

## 2. 核心组件

### 2.1 ChatContainer

`ChatContainer` 是应用的核心组件，负责管理聊天状态和与 AI 服务的交互。

**位置**：`src/containers/ChatContainer.tsx`

**Props**：

| 属性名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| platform | string | AI 服务平台 | 必填 |
| model | string | AI 模型名称 | 可选 |
| fetch | function | 自定义 fetch 函数 | 可选 |

**示例用法**：

```typescript
<ChatContainer 
  platform="GEMINI" 
  model="gemini-2.5-flash-lite" 
  fetch={customFetch} 
/>
```

### 2.2 DefaultChatTransport

使用 AI SDK 提供的 `DefaultChatTransport` 实现与 AI 服务的通信。

**配置选项**：

| 配置项 | 类型 | 描述 |
|--------|------|------|
| api | string | AI 服务 API 端点 |
| body | object | 请求体参数，包含平台和模型信息 |
| fetch | function | 可选的自定义 fetch 函数 |

**当前配置**：

```typescript
const transport = new DefaultChatTransport({
  api: '/api/dev/call-service/v2/aiGenTextStream',
  body: { platform, ...(model && { model }) },
  ...(customFetch && { fetch: customFetch })
});
```

## 3. 模拟数据支持

应用支持使用模拟数据进行开发和测试，通过 `createMockStreamFetch` 函数实现。

**位置**：`tests/createMockStreamFetch.ts`

**使用方式**：

1. 在 `App.tsx` 中通过开关控制是否使用模拟数据
2. 动态导入模拟函数并创建自定义 fetch 函数
3. 将自定义 fetch 函数传递给 `ChatContainer`

**示例代码**：

```typescript
// 动态导入模拟函数
useEffect(() => {
  if (useMockData && import.meta.env.DEV) {
    import('../tests/createMockStreamFetch').then((mockModule) => {
      const { createMockStreamFetch, generateMockAIResponse } = mockModule;
      const fetchFn = createMockStreamFetch({
        chunks: generateMockAIResponse('Hi there! This is a mock response from AI. How can I help you today?')
      });
      setMockFetch(fetchFn);
    });
  } else {
    setMockFetch(null);
  }
}, [useMockData]);
```

## 4. 支持的平台和模型

当前应用配置为使用 GEMINI 平台，但可以通过修改 `platform` 和 `model` 属性支持其他平台和模型。

### 4.1 支持的平台

- GEMINI

### 4.2 支持的模型

- gemini-2.5-flash-lite

## 5. API 参考

### 5.1 useChat Hook

使用 AI SDK 提供的 `useChat` hook 管理聊天状态：

```typescript
const chatState = useChat({
  transport,
  onData: (part) => {
    console.log('onData', part);
  }
});

const { messages, error, sendMessage } = chatState;
```

**返回值**：

| 属性名 | 类型 | 描述 |
|--------|------|------|
| messages | array | 聊天消息列表 |
| error | object | 错误信息 |
| sendMessage | function | 发送消息函数 |

### 5.2 sendMessage 函数

```typescript
sendMessage({ text: input });
```

**参数**：

| 参数名 | 类型 | 描述 |
|--------|------|------|
| text | string | 要发送的消息文本 |

## 6. 开发流程

1. 配置 AI 服务平台和模型
2. 实现自定义 fetch 函数（可选）
3. 创建 `ChatContainer` 组件实例
4. 处理聊天状态和消息

## 7. 扩展建议

1. 添加更多 AI 平台支持
2. 实现消息历史记录管理
3. 支持更多消息类型（如图片、文件）
4. 添加消息编辑和删除功能
5. 实现对话主题管理

## 8. 故障排除

### 8.1 连接问题

- 检查 API 端点配置是否正确
- 检查网络连接
- 查看浏览器控制台错误信息

### 8.2 模拟数据问题

- 确保在开发环境中使用模拟数据
- 检查模拟数据生成函数是否正确

## 9. 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2024-01-01 | 初始版本，支持 GEMINI 平台和流式聊天 |
