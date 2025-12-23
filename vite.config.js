import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  /**
   * BUILD CONFIGURATION FOR CODE SPLITTING
   *
   * This configuration creates separate chunks for:
   * 1. Vendor code (React, React-DOM, dnd-kit)
   * 2. Lazy-loaded modal components (automatic via React.lazy)
   *
   * Benefits:
   * - Smaller initial bundle
   * - Better caching (vendor rarely changes)
   * - Modals loaded on-demand
   */
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting function for rolldown-vite
        manualChunks(id) {
          // Vendor chunk - React core
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }

          // DnD-kit chunk - drag and drop library
          if (id.includes('node_modules/@dnd-kit')) {
            return 'vendor-dnd'
          }

          // Virtualization chunk
          if (id.includes('node_modules/react-window')) {
            return 'vendor-virtual'
          }

          // Lazy-loaded modals will be automatically split by React.lazy()
        },
      },
    },

    // Enable source maps for debugging (optional)
    sourcemap: true,

    // Report chunk sizes
    chunkSizeWarningLimit: 500, // KB
  },
})
