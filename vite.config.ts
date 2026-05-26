import path from 'path';
import fs from 'fs/promises';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { blogPosts } from './services/blogPosts';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    const siteUrl = env.SITE_URL || 'https://www.txttohandwriting.org';

    return {
      plugins: [react()],

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },

      build: {
        // Optimize for production
        minify: isProduction ? 'esbuild' : false,
        sourcemap: !isProduction,
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name]-www-[hash].js',
            chunkFileNames: 'assets/[name]-www-[hash].js',
            assetFileNames: 'assets/[name]-www-[hash][extname]',
            // Advanced code splitting for better caching and smaller initial bundle
            manualChunks: (id) => {
              if (id.includes('vite/preload-helper')) {
                return 'preload-helper';
              }
              
              // Image processing libraries
              if (id.includes('html-to-image') || id.includes('react-image-crop')) {
                return 'vendor-image';
              }
              
              // Canvas rendering system (split into separate chunk)
              if (id.includes('/services/canvasRenderer') || 
                  id.includes('/services/enhancedCanvasRenderer') ||
                  id.includes('/services/progressiveCanvasRenderer')) {
                return 'canvas-renderer';
              }
              
              // Font management system
              if (id.includes('/services/font') || 
                  id.includes('/services/customFontUploadManager')) {
                return 'font-system';
              }
              
              // Texture and image processing
              if (id.includes('/services/texture') || 
                  id.includes('/services/paperTexture') ||
                  id.includes('/services/imageExport') ||
                  id.includes('/services/imageCompression')) {
                return 'texture-system';
              }
              
              // PDF export (lazy loaded)
              if (id.includes('/services/pdfExporter')) {
                return 'pdf-export';
              }
              
              // Page components (each gets its own chunk via lazy loading)
              if (id.includes('/components/AboutPage') || 
                  id.includes('/components/TermsPage') ||
                  id.includes('/components/FaqPage') ||
                  id.includes('/components/BlogPage') ||
                  id.includes('/components/BlogPostPage') ||
                  id.includes('/components/ChangeLogPage') ||
                  id.includes('/components/NotFoundPage')) {
                return 'pages';
              }
              
              // Homepage content sections (lazy loaded)
              if (id.includes('/components/homepage/')) {
                return 'homepage-sections';
              }
              
              // Heavy components
              if (id.includes('/components/HandwritingPreview') ||
                  id.includes('/components/CanvasOutput') ||
                  id.includes('/components/CustomFontUploader')) {
                return 'heavy-components';
              }
              
              // Other services
              if (id.includes('/services/') && !id.includes('node_modules')) {
                return 'services';
              }
              
              // Other node_modules
              if (id.includes('node_modules')) {
                return 'vendor-other';
              }
            }
          }
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 600,
        // Remove console.log in production
        esbuild: isProduction ? {
          drop: ['console', 'debugger'],
          dropLabels: ['DEV']
        } : undefined
      },

      server: {
        host: true,
        allowedHosts: [
          '3cc048a316ae.ngrok-free.app'
        ]
      },

      optimizeDeps: {
        include: ['react', 'react-dom', 'react-i18next', 'i18next']
      },

      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts']
      }
    };
});
