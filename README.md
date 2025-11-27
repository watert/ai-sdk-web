# React AI SDK 示例项目

这是一个基于 Vite + React + TypeScript 构建的 AI 聊天应用示例，展示了如何集成和使用 AI SDK 实现流式聊天功能。

## 技术栈

- **前端框架**: React 19.2.0
- **构建工具**: Vite 7.2.4
- **类型检查**: TypeScript 5.9.3
- **AI SDK**: @ai-sdk/react 2.0.102
- **HTTP 客户端**: Axios 1.13.2
- **代码检查**: ESLint
- **包管理器**: Yarn (推荐)

## 包管理

本项目推荐使用 Yarn 作为包管理器，以确保依赖版本的一致性和安装速度。所有命令均支持 Yarn 和 npm，但优先使用 Yarn。

## 快速开始

### 1. 安装依赖

```bash
# 使用 yarn
yarn install

# 或使用 npm
npm install
```

### 2. 启动开发服务器

```bash
# 使用 yarn
yarn dev

# 或使用 npm
npm run dev
```

开发服务器将在 http://localhost:5173 启动。

### 3. 构建生产版本

```bash
# 使用 yarn
yarn build

# 或使用 npm
npm run build
```

构建产物将生成在 `dist` 目录中。

### 4. 预览生产版本

```bash
# 使用 yarn
yarn preview

# 或使用 npm
npm run preview
```

## 项目结构

```
├── src/             # 源代码目录
│   ├── App.tsx      # 主应用组件（核心聊天功能）
│   ├── main.tsx     # 应用入口
│   ├── App.css      # 应用样式
│   ├── index.css    # 全局样式
│   └── assets/      # 静态资源
├── dist/            # 构建输出目录
├── public/          # 公共资源目录
├── package.json     # 依赖和脚本配置
├── vite.config.ts   # Vite 构建配置
├── tsconfig.json    # TypeScript 配置
└── eslint.config.js # ESLint 配置
```

## 核心功能

### 1. AI 聊天界面
- 实现了简洁的聊天界面，支持用户输入和 AI 回复
- 区分显示用户和 AI 角色的消息
- 支持消息的流式显示

### 2. AI SDK 集成
- 使用 `@ai-sdk/react` 提供的 `useChat` 钩子管理聊天状态
- 配置 `DefaultChatTransport` 连接到 AI 服务 API
- 支持接收流式 AI 响应
- 实时更新聊天界面

### 3. 网络请求配置
- 配置了 API 代理，支持开发环境下的跨域请求
- 代理规则：
  - `/api` 请求代理到 `http://localhost:5001`
  - `/api-v2` 请求代理到 `https://testnet.myweb3pass.xyz/api-v2/`

## 配置说明

### Vite 配置

主要配置文件：`vite.config.ts`

### AI 服务配置

在 `App.tsx` 中配置 AI 服务连接：

```typescript
const transport = new DefaultChatTransport({
  api: '/api/dev/call-service/v2/aiGenTextStream',
  body: { platform: 'GEMINI' },
})
```

## 开发流程

### 1. 代码检查

```bash
# 使用 yarn
yarn lint

# 或使用 npm
npm run lint
```

### 2. 分析构建产物

```bash
# 使用 yarn
yarn analyze

# 或使用 npm
npm run analyze
```

## 构建部署

1. 运行构建命令生成生产版本：
   ```bash
   yarn build
   ```

2. 将 `dist` 目录下的所有文件部署到 Web 服务器上即可。

## 许可证

MIT
