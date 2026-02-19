import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Code splitting for faster initial load on slow connections
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: Vue core (cached separately, rarely changes)
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          // Vendor: Axios (network layer)
          'vendor-axios': ['axios'],
          // Vendor: Misc
          'vendor-misc': ['moment', 'moment-timezone'],
        },
        // Clean chunk filenames
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Target older browsers for broader compatibility on mobile
    target: 'es2015',
    // Inline assets smaller than 4KB
    assetsInlineLimit: 4096,
    // Enable source maps for debugging (disable in true production)
    sourcemap: false,
    // Minify with esbuild (fastest)
    minify: 'esbuild',
  },
})
