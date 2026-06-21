import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ];
    },

    experimental: {
      serverActions: {
          bodySizeLimit: "100MB"
      }
  },

  images: {
      remotePatterns: [
          {
              protocol: "https",
              hostname: "static.vecteezy.com"
          },
          {
              protocol: "https",
              hostname: "cloud.appwrite.io",
          }
      ]
  }
};

export default nextConfig;
