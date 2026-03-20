import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env': process.env,
    '__BUILD_VERSION__': JSON.stringify('2.3'),
    '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
