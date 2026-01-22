
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    hmr: { overlay: true }
  },
  base: './',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  assetsInclude: ['**/*.m4a', '**/*.mp3']
});
``
