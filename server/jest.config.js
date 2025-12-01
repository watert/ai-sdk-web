const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    // '^.+\.ts?$': ['ts-jest', { isolatedModules: true, useESM: true }],
    ...tsJestTransformCfg,
  },
  // 忽略 dist 文件夹
  testPathIgnorePatterns: ['<rootDir>/dist/'],
};