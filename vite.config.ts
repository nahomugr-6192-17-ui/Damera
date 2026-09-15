import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for production build (change to '/your-repo-name/' for GitHub Pages)
  base: './',

  // Development server settings
  server: {
    port: 5173,
    open: true,
  },

  // Build output
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
