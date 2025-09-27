import path from 'path';
import fs from 'fs/promises';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { blogPosts } from './services/blogPosts';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    const siteUrl = env.SITE_URL || 'https://txttohandwriting.org';

    const generateSitemapPlugin = () => {
      let resolvedOutDir = 'dist';
      let publicDir = path.resolve(__dirname, 'public');

      return {
        name: 'generate-sitemap',
        apply: 'build',
        configResolved(resolvedConfig) {
          resolvedOutDir = path.resolve(resolvedConfig.root || process.cwd(), resolvedConfig.build.outDir || 'dist');
          if (resolvedConfig.publicDir) {
            publicDir = path.resolve(resolvedConfig.root || process.cwd(), resolvedConfig.publicDir);
          }
        },
        async closeBundle() {
          const normalizedSiteUrl = siteUrl.replace(/\/+$|$/, '/');
          const today = new Date().toISOString().split('T')[0];

          const staticPages: Array<{ path: string; priority: string; lastmod: string }> = [
            { path: '', priority: '1.0', lastmod: today },
            { path: 'about', priority: '0.7', lastmod: today },
            { path: 'faq', priority: '0.6', lastmod: today },
            { path: 'terms', priority: '0.4', lastmod: today },
            { path: 'blog', priority: '0.7', lastmod: today },
            { path: 'changelog', priority: '0.6', lastmod: today }
          ];

          const blogUrls = blogPosts.map(post => {
            const parsedDate = new Date(post.date);
            const lastmod = isNaN(parsedDate.getTime()) ? today : parsedDate.toISOString().split('T')[0];
            return {
              path: `blog/${post.slug}`,
              priority: '0.65',
              lastmod
            };
          });

          const allUrls = [...staticPages, ...blogUrls];

          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            allUrls.map(url => {
              const loc = `${normalizedSiteUrl}${url.path}`.replace(/\/$/, '') || normalizedSiteUrl.replace(/\/$/, '');
              return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`;
            }).join('\n') +
            '\n</urlset>\n';

          const imageNamespace = 'http://www.google.com/schemas/sitemap-image/1.1';
          const imageSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="${imageNamespace}">\n` +
            blogPosts.map(post => {
              const loc = `${normalizedSiteUrl}blog/${post.slug}`.replace(/\/$/, '');
              const lastmod = (() => {
                const parsedDate = new Date(post.date);
                return isNaN(parsedDate.getTime()) ? today : parsedDate.toISOString().split('T')[0];
              })();
              return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <image:image>\n      <image:loc>${normalizedSiteUrl}app-screenshot.jpg</image:loc>\n      <image:title><![CDATA[${post.title}]]></image:title>\n    </image:image>\n  </url>`;
            }).join('\n') +
            '\n</urlset>\n';

          await fs.mkdir(resolvedOutDir, { recursive: true });
          await fs.writeFile(path.join(resolvedOutDir, 'sitemap.xml'), sitemap, 'utf8');
          await fs.writeFile(path.join(resolvedOutDir, 'sitemap-images.xml'), imageSitemap, 'utf8');

          await fs.mkdir(publicDir, { recursive: true });
          await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
          await fs.writeFile(path.join(publicDir, 'sitemap-images.xml'), imageSitemap, 'utf8');
        }
      };
    };

    return {
      plugins: [react(), generateSitemapPlugin()],

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
            // Code splitting for better caching
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['html-to-image', 'react-image-crop'],
              services: [
                './services/canvasRenderer',
                './services/fontManager',
                './services/customFontUploadManager'
              ]
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

      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts']
      }
    };
});
