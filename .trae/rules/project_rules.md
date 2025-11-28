总是使用中文回复。

生成代码过程中，如果可以预见会有较多重复的逻辑，应该在同文件中实现相对应的 helper function 来进行处理;

## 技术栈

- 基础框架: yarn, typescript, react, tsx, vite, react-router-dom v7
- 样式框架: clsx, tailwindcss v4, tailwind-merge
- 状态管理: react-use v1.3.1,
    * global store: appStore(`src/store/store.ts`) based on zustand v5
- HTTP Client: appAxios(`src/models/appAxios.ts`) based on axios 1.13.2
- query string: qs 6.14.0
- utils: dayjs, lodash
- 通知库: sonner 2.0.7
- AI SDK: @ai-sdk/react 2.0.102

## 其他的一些 Guidelines
* 样式指引: style-guide.md
* RESTful API 指引： api-restful.md