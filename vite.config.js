import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy all /api/* requests to Express backend during dev
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {

    // Increase chunk warning limit slightly (your app is legitimately large)

    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {

          // React core — cached long-term, rarely changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Animation library — large, split out
          'vendor-framer': ['framer-motion'],

          // Recharts for admin dashboard — only needed on /admin routes
          'vendor-charts': ['recharts'],

          // Radix UI primitives — large collection
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-avatar',
            '@radix-ui/react-progress',
            '@radix-ui/react-toggle',
          ],

          // Supabase — only needed after payment/admin
          'vendor-supabase': ['@supabase/supabase-js'],

          // Excel export — only triggered on demand
          'vendor-xlsx': ['xlsx'],

          // PDF — only triggered on demand
          'vendor-pdf': ['jspdf'],

          // Lucide icons — large icon set
          'vendor-lucide': ['lucide-react'],

          // Date utils
          'vendor-dates': ['date-fns'],

          // Admin panel chunk — only loads on /admin routes
          'admin': [
            './src/pages/admin/AdminDashboard.jsx',
            './src/pages/admin/enrollments/AdminEnrollments.jsx',
            './src/pages/admin/AdminAssessments.jsx',
            './src/pages/admin/AdminLayout.jsx',
            './src/pages/admin/AdminLogin.jsx',
            './src/pages/admin/AdminGuard.jsx',
            './src/pages/admin/adminApi.js',
            './src/pages/admin/adminUtils.js',
          ],
        },
      },
    },
    // Minify with esbuild (default, fastest)
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps off in prod
    sourcemap: false,
    // Target modern browsers only (smaller output, no legacy polyfills)
    target: 'es2020',
  },
  // Optimize deps — pre-bundle these for faster dev starts
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
    ],
  },
});