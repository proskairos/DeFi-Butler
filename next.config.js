/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@defi-butler/types'],
  
  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Exclude problematic packages (Solana, Coinbase CDP)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana/addresses': false,
      '@solana/kit': false,
      '@coinbase/cdp-sdk': false,
      '@base-org/account': false,
    };
    
    // Ignore warnings from optional dependencies
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /@walletconnect\/logger/ },
      { module: /pino/ },
      { module: /@react-native-async-storage/ },
    ];
    
    return config;
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
