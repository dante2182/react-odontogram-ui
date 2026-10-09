/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.lib.json',
      bundleTypes: true,
      include: ['src'],
      exclude: [
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/test',
        'src/main.tsx',
        'src/App.tsx',
      ],
    }),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'OdontogramUI',
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es' ? 'odontogram-ui.js' : 'odontogram-ui.cjs',
      cssFileName: 'odontogram-ui',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*', 'src/test', 'src/index.ts'],
    },
  },
})
