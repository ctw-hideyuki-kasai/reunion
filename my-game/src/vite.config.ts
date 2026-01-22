
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    hmr: { overlay: true }
  },
  base: '',
  build: {
    assetsDir: 'assets'
  },
  assetsInclude: ['**/*.m4a']
});
``
