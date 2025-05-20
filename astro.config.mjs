import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [tailwind(), sitemap()],
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