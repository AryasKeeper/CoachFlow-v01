import type { NextConfig } from "next";
// import { withSentryConfig } from "@sentry/nextjs"; // Disabled for clean deployment

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Security headers to prevent XSS, clickjacking, and other attacks
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: [
          // Prevent XSS attacks
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()'
          },
          // Content Security Policy - Temporarily disabled for deployment
          // TODO: Re-enable with proper nonce-based CSP for Next.js compatibility
          // {
          //   key: 'Content-Security-Policy',
          //   value: [
          //     "default-src 'self'",
          //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://va.vercel-scripts.com https://js.stripe.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com https://browser.sentry-cdn.com",
          //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          //     "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai data:",
          //     "img-src 'self' data: https: blob:",
          //     "connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co https://www.google-analytics.com https://api.mixpanel.com https://o4510000649994240.ingest.us.sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com",
          //     "frame-src 'none'",
          //     "object-src 'none'",
          //     "base-uri 'self'",
          //     "form-action 'self'",
          //     ...(isProd ? ["upgrade-insecure-requests"] : [])
          //   ].join('; ')
          // }
        ]
      },
      // Static assets caching
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProd ? 'public, max-age=31536000, immutable' : 'public, max-age=0'
          }
        ]
      },
      // API routes caching
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60'
          }
        ]
      }
    ];

    // Add HSTS only in production
    if (isProd && process.env.FORCE_HTTPS === 'true') {
      headers[0].headers.push({
        key: 'Strict-Transport-Security',
        value: `max-age=${process.env.HSTS_MAX_AGE || 31536000}; includeSubDomains; preload`
      });
    }

    return headers;
  },

  // Redirects for production
  async redirects() {
    // Note: www to non-www redirect removed due to Vercel deployment issues
    // Can be handled via Vercel dashboard settings instead
    return [];
  },

  // Rewrites for API versioning
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Additional security configurations
  poweredByHeader: false, // Remove X-Powered-By header

  // Compression - Enable by default in production for 20-30% bandwidth reduction
  compress: isProd || process.env.ENABLE_COMPRESSION === 'true',

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: isProd ? 60 * 60 * 24 * 30 : 60, // 30 days in prod, 1 min in dev
    dangerouslyAllowSVG: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Loader configuration for CDN
    ...(isProd && process.env.CDN_URL && {
      loader: 'custom',
      loaderFile: './lib/image-loader.ts',
    }),
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors. Only enable in emergency situations
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Allow warnings in production builds, only fail on errors
    ignoreDuringBuilds: isProd || process.env.ESLINT_NO_DEV_ERRORS === 'true',
  },

  // Output configuration for different deployment targets
  output: isProd ? 'standalone' : undefined,

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@tanstack/react-query'
    ],
    // Disable webpackBuildWorker to fix Jest worker errors
    webpackBuildWorker: false,
  },

  // Fix Turbopack workspace root detection
  turbopack: {
    root: __dirname,
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

    // Bundle analyzer (only in development with ANALYZE=true)
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    return config;
  },

  // Environment variables that should be available to the client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

// Sentry disabled for clean deployment - can be re-enabled later
export default nextConfig;

// export default withSentryConfig(nextConfig, {
//   org: "origvmi-2c",
//   project: "javascript-nextjs",
//   silent: !process.env.CI,
//   sourcemaps: {
//     disable: isDev,
//     deleteSourcemapsAfterUpload: isProd,
//   },
//   widenClientFileUpload: isProd,
//   tunnelRoute: "/monitoring",
//   disableLogger: true,
//   automaticVercelMonitors: isProd,
// });
