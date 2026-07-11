import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the built site can be opened directly from the
  // extracted ZIP via file:// — no dev server required.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
