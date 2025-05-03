import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  vite: {
    optimizeDeps: {
      disabled: false,
    },
    ssr: {
      noExternal: ['@rollup/pluginutils']
    },
    build: {
      rollupOptions: {
        external: ['rollup/dist/native']
      }
    }
  }
});