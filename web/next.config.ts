import type { NextConfig } from "next";

const corsOrigin = process.env.TERCIO_CORS_ORIGIN ?? "https://tercios.yampi.eu";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    const flaskTarget = process.env.TERCIO_FLASK_PROXY_TARGET;
    if (!flaskTarget) return [];

    return [
      {
        source: "/api/flask/:path*",
        destination: `${flaskTarget}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: corsOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/barracks", destination: "/soldier", permanent: true },
    ];
  },
};

export default nextConfig;
