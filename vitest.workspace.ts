import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'protocol',
      root: './packages/protocol',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'web-app',
      root: './services/forumline-web',
      include: ['src/**/*.test.ts'],
    },
    resolve: {
      alias: {
        '@forumline/protocol': './packages/protocol/src/index.ts',
      },
    },
  },
])
