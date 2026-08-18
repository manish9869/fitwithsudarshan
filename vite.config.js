import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { writeFileSync } from 'fs';

// One id per build, used by the frontend to detect "a newer deploy exists"
// while a tab is already open (see src/hooks/useBuildVersionCheck.js) — the
// lazyRetry() self-heal already covers a stale chunk failing to *load*, but
// nothing previously told an already-open tab that hadn't touched a new
// route yet that a newer build was live at all.
const BUILD_ID = String(Date.now());

// public/ files are copied verbatim before the build even starts, so this
// can't be a static file — it has to be written after Vite finishes, with
// the exact same id that got baked into the JS bundle via `define`.
function writeVersionFile() {
  return {
    name: 'write-version-json',
    closeBundle() {
      writeFileSync(path.resolve(__dirname, 'dist/version.json'), JSON.stringify({ buildId: BUILD_ID }));
    },
  };
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    tailwindcss(),
    writeVersionFile(),
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
        // FIX: this used to manually isolate jspdf/recharts/xlsx/admin-pages
        // into their own named chunks (both as a plain object, and then as a
        // function — neither actually fixed it). A PageSpeed Insights audit
        // caught the real symptom: index.html's entry script statically
        // imported vendor-pdf (594KB) and vendor-charts (431KB), and every
        // manually-named chunk got a <link rel="modulepreload"> in
        // index.html — ~377KB+ of admin-only JS fetched at HIGH priority on
        // every first visit to the public landing page, a big chunk of a
        // 7.6s LCP / 9.3s Time to Interactive.
        //
        // Root cause (confirmed via sourcemap): jsPDF has its own internal
        // `import('html2canvas')` call. Forcing jsPDF into an isolated
        // manual chunk put that dynamic-import call site — and the small
        // shared Vite runtime helper every dynamic import() needs — inside
        // that chunk. The entry ALSO needs that same shared helper for its
        // own 39 lazy-loaded routes, so Rollup wired the entry to import it
        // from vendor-pdf, dragging the whole 594KB chunk along for a
        // ~150-byte function. The 'admin' grouping had the identical risk
        // (it included adminUtils.js, which also imports jsPDF).
        //
        // Fix: only manually chunk libraries with no such internal dynamic
        // imports that are ALSO genuinely needed on every page (React,
        // Framer Motion, the 4 Radix primitives the landing page's
        // ToolsSection uses, Lucide icons). Everything admin-only
        // (jspdf/recharts/xlsx/the admin pages themselves) is left to
        // Rollup's default automatic splitting, which correctly keeps
        // async-only code async without this kind of cross-chunk leak.
        manualChunks(id) {
          const norm = id.split('\\').join('/');
          if (!norm.includes('node_modules')) return;

          // React core — cached long-term, rarely changes
          if (
            norm.includes('/node_modules/react/') ||
            norm.includes('/node_modules/react-dom/') ||
            norm.includes('/node_modules/react-router-dom/') ||
            norm.includes('/node_modules/scheduler/')
          ) return 'vendor-react';

          // Animation library — large, split out
          if (norm.includes('/node_modules/framer-motion/')) return 'vendor-framer';

          // Radix UI primitives actually in use (select/tabs/slider/label —
          // everything else was only reachable through the shadcn ui/
          // scaffold files, which were unused and removed)
          if (
            norm.includes('/node_modules/@radix-ui/react-select/') ||
            norm.includes('/node_modules/@radix-ui/react-tabs/') ||
            norm.includes('/node_modules/@radix-ui/react-slider/') ||
            norm.includes('/node_modules/@radix-ui/react-label/')
          ) return 'vendor-radix';

          // Lucide icons — large icon set
          if (norm.includes('/node_modules/lucide-react/')) return 'vendor-lucide';
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