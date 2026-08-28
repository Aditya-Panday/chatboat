import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "localhost:5173",
    "127.0.0.1:3000",
    "http://dev.cov.com:3000",
  ],
  async headers() {
    return [
      {
        source: "/widget",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
      {
        source: "/widget.js",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
