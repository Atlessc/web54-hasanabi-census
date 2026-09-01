import {defineConfig} from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  base: './',
  build: {
    assetsInlineLimit: 0,
    outDir: 'dist',
    sourcemap: false,
  },
})
