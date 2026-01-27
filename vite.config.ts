import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Temporarily disabled for production debugging
    /*
    mode === "production" && compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
    mode === "production" && compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    */
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk sizes
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core - rarely changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI library - stable
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Data fetching - stable
          'vendor-query': ['@tanstack/react-query'],
          // Charts - large, only needed on some pages
          'vendor-charts': ['recharts'],
          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Supabase - backend
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Disable source maps in production for smaller bundle
    sourcemap: false,
    // Minification settings
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // CSS code splitting
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
}));

