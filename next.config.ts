import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
          // Content Security Policy - Strict but allows necessary resources
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co https://www.google-analytics.com https://api.mixpanel.com https://o4510000649994240.ingest.us.sentry.io https://*.ingest.sentry.io",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              ...(isProd ? ["upgrade-insecure-requests"] : [])
            ].join('; ')
          }
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
    const redirects = [];

    // Redirect www to non-www in production
    if (isProd) {
      redirects.push({
        source: '/:path*',
        has: [
          {
            type: 'host',
            key: 'host',
            value: 'www.coachflow.com',
          },
        ],
        destination: 'https://coachflow.com/:path*',
        permanent: true,
      });
    }

    return redirects;
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

// Make sure adding Sentry options is the last code to run before exporting
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "origvmi-2c",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Sourcemaps configuration - disable in development to avoid file conflicts with Turbopack
  sourcemaps: {
    disable: isDev, // Disable sourcemaps in development to prevent ENOENT errors
    deleteSourcemapsAfterUpload: isProd, // Only delete after upload in production
  },

  // Upload a larger set of source maps for prettier stack traces (only in production)
  widenClientFileUpload: isProd,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  // hideSourceMaps: true, // Deprecated - use sourcemaps config instead

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  automaticVercelMonitors: isProd, // Only enable in production
});
