import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Relative base so the build works from a domain root and from a sub-folder.
   Routes are one level deep (/work, /services ...), so relative asset paths resolve correctly. */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 900 }
});
