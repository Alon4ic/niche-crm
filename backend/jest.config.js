// Конфигурация e2e-тестов (тесты идут через HTTP к настоящему приложению и тестовой БД).
// Если в package.json уже есть ключ "jest" или другой jest-конфиг, удалите его или переименуйте этот файл.
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  // SWC, как и сборка Nest: быстро, но типы НЕ проверяет (типы проверяет npx tsc --noEmit)
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  globalSetup: '<rootDir>/test/setup/global-setup.ts',
  setupFiles: ['<rootDir>/test/setup/env.ts'],
  // Одна общая БД: тесты идут по очереди, в одном процессе
  maxWorkers: 1,
  testTimeout: 30000,
};
