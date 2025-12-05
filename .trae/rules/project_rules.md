总是使用中文回复。

生成代码过程中，如果可以预见会有较多重复的逻辑，应该在同文件中实现相对应的 helper function 来进行处理;
编码过程中，尽可能使用 modern ES 语法和特性，如箭头函数、解构赋值、可选链等；以及使用 lodash 等 utility library 来简化代码。

## 技术栈

- 基础框架: yarn, typescript, react, tsx, vite
- 路由框架: react-router-dom (hashRouter)
- 样式框架: clsx, tailwindcss v4, tailwind-merge
- query string: qs 6.14.0
- utils: dayjs, lodash
- 通知库: sonner 2.0.7
- 状态管理: react-use v1.3.1,
    * global store: appStore(`src/store/store.ts`) based on zustand v5
- HTTP Client: appAxios(`src/models/appAxios.ts`) based on axios 1.13.2
- AI SDK: @ai-sdk/react 2.0.102

## 其他的一些 Guidelines
* 样式指引: style-guide.md
* RESTful API 指引： api-restful.md