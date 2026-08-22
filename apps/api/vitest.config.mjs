import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@api': '/src'
    }
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      JWT_PRIVATE_KEY: 'test_private_key',
      JWT_PUBLIC_KEY: 'test_public_key',
      NODE_ENV: 'test'
    }
  },
});
