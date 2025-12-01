/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.test.json',
    }],
  },
  // 忽略 dist 文件夹
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  // 确保 jsdom 环境正确设置
  setupFiles: [],
  setupFilesAfterEnv: [],
  // 确保 jsdom 环境正确提供 Web API
  testEnvironmentOptions: {
    // 启用完整的 jsdom 功能
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable',
  },
};
